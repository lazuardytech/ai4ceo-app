import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { getCurrentUser } from '@/lib/auth-guard';
import { generateUUID } from '@/lib/utils';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { userFile } from '@/lib/db/schema';

export const runtime = 'nodejs';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((issue) => issue.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      R2_PUBLIC_BASE_URL,
    } = process.env as Record<string, string | undefined>;

    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME
    ) {
      return NextResponse.json(
        { error: 'R2 is not configured. Missing environment variables.' },
        { status: 500 },
      );
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `uploads/${Date.now()}-${generateUUID()}-${filename}`;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: (file as any).type || 'application/octet-stream',
        }),
      );

      const publicBase =
        R2_PUBLIC_BASE_URL ||
        `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;
      const url = `${publicBase}/${key}`;

      // Persist file metadata to UserFile table
      try {
        const sql = postgres(process.env.POSTGRES_URL!);
        const db = drizzle(sql);
        await db.insert(userFile).values({
          userId: user.id,
          name: filename,
          url,
          contentType: (file as any).type || null,
          size: String(((file as any).size as number) ?? ''),
          storagePath: key,
        });
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to save file metadata' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        url,
        pathname: key,
        contentType: (file as any).type,
        size: (file as any).size,
        name: filename,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
