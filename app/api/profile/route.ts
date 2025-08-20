import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-guard';
import { ChatSDKError } from '@/lib/errors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { user as userTable, setting as settingTable } from '@/lib/db/schema';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { generateCUID } from '@/lib/utils';

export const runtime = 'nodejs';

// Shared db helper
function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('POSTGRES_URL is not configured.');
  }
  const sql = postgres(url);
  const db = drizzle(sql);
  return { db, sql };
}

// R2 client helper
function getR2Client() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
  } = process.env as Record<string, string | undefined>;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 is not configured. Missing environment variables.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

const jsonUpdateSchema = z.object({
  name: z.string().trim().max(128).optional(),
  bio: z.string().trim().max(2048).optional(),
  timezone: z.string().trim().max(64).optional(),
  locale: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-_]{1,16}$/)
    .optional(),
  imageUrl: z.string().url().optional(),
  botTraits: z.array(z.string()).optional(),
});

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxAvatarSizeBytes = 2 * 1024 * 1024; // 2MB

// Use Blob instead of File in zod, since File may not be available in Node runtime typings
const multipartSchema = z.object({
  name: z.string().trim().max(128).optional(),
  bio: z.string().trim().max(2048).optional(),
  timezone: z.string().trim().max(64).optional(),
  locale: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-_]{1,16}$/)
    .optional(),
  image: z
    .instanceof(Blob)
    .refine((f) => f.size <= maxAvatarSizeBytes, {
      message: 'Image should be 2MB or smaller',
    })
    .refine((f) => allowedImageTypes.includes((f as any).type), {
      message: 'Unsupported image type. Allowed: JPEG, PNG, WEBP',
    })
    .optional(),
});

async function uploadAvatarToR2({
  file,
  userId,
  filename,
}: {
  file: Blob;
  userId: string;
  filename: string;
}) {
  const {
    R2_ACCOUNT_ID,
    R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL,
  } = process.env as Record<string, string | undefined>;
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
    throw new Error('R2 bucket config missing');
  }

  const client = getR2Client();
  const key = `avatars/${userId}/${Date.now()}-${generateCUID()}-${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: (file as any).type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  const publicBase =
    R2_PUBLIC_BASE_URL ||
    `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

  return {
    key,
    url: `${publicBase}/${key}`,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    const { db } = getDb();

    const rows = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        image: userTable.image,
        bio: userTable.bio,
        timezone: userTable.timezone,
        locale: userTable.locale,
        role: userTable.role,
        onboarded: userTable.onboarded,
      })
      .from(userTable)
      .where(eq(userTable.id, user.id));

    const [profile] = rows;

    if (!profile) {
      return new ChatSDKError('not_found:auth', 'User not found').toResponse();
    }

    // Load preferences
    const key = `user:${user.id}:preferences`;
    const prefRows = await db
      .select({ value: settingTable.value })
      .from(settingTable)
      .where(eq(settingTable.key, key));
    const prefs = (prefRows?.[0]?.value as any) || {};
    const botTraits = Array.isArray(prefs.botTraits) ? prefs.botTraits : [];

    return NextResponse.json({ ...profile, botTraits });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    const { db } = getDb();
    const updates: Record<string, any> = {};
    let didPrefsUpdate = false;

    if (contentType.includes('multipart/form-data')) {
      // Multipart/form-data update with optional image file
      const form = await request.formData();

      const parsed = multipartSchema.safeParse({
        name: form.get('name') ?? undefined,
        bio: form.get('bio') ?? undefined,
        timezone: form.get('timezone') ?? undefined,
        locale: form.get('locale') ?? undefined,
        image: (form.get('image') as File) ?? undefined,
      });

      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(', ');
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const { name, bio, timezone, locale, image } = parsed.data;

      if (name !== undefined) updates.name = name;
      if (bio !== undefined) updates.bio = bio;
      if (timezone !== undefined) updates.timezone = timezone;
      if (locale !== undefined) updates.locale = locale;

      if (image) {
        // Get filename from the file input if available
        const fileName = ((form.get('image') as File)?.name as string) || 'avatar';
        try {
          const { url } = await uploadAvatarToR2({
            file: image,
            userId: user.id,
            filename: fileName,
          });
          updates.image = url;
        } catch (e) {
          console.warn('Avatar upload failed:', e);
          return NextResponse.json(
            { error: 'Failed to upload avatar' },
            { status: 500 },
          );
        }
      }
    } else {
      // JSON update with optional imageUrl
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new ChatSDKError('bad_request:api', 'Invalid JSON').toResponse();
      }

      const parsed = jsonUpdateSchema.safeParse(body);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(', ');
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const { name, bio, timezone, locale, imageUrl, botTraits } = parsed.data;

      if (name !== undefined) updates.name = name;
      if (bio !== undefined) updates.bio = bio;
      if (timezone !== undefined) updates.timezone = timezone;
      if (locale !== undefined) updates.locale = locale;
      if (imageUrl !== undefined) updates.image = imageUrl;

      // Update preferences if provided
      if (botTraits !== undefined) {
        const key = `user:${user.id}:preferences`;
        const now = new Date();
        const value = { botTraits, onboarded: true } as any;
        // Upsert-like behavior
        // Using drizzle update + insert pattern similar to onboarding
        const updated = await db
          .update(settingTable)
          .set({ value, updatedAt: now })
          .where(eq(settingTable.key, key))
          .returning();
        if (!updated || updated.length === 0) {
          await db
            .insert(settingTable)
            .values({ key, value, updatedAt: now })
            .returning();
        }
        didPrefsUpdate = true;
      }
    }

    if (Object.keys(updates).length === 0) {
      if (didPrefsUpdate) {
        // Return current profile with latest preferences
        const rows = await db
          .select({
            id: userTable.id,
            email: userTable.email,
            name: userTable.name,
            image: userTable.image,
            bio: userTable.bio,
            timezone: userTable.timezone,
            locale: userTable.locale,
            role: userTable.role,
            onboarded: userTable.onboarded,
          })
          .from(userTable)
          .where(eq(userTable.id, user.id));
        const [profile] = rows;
        return NextResponse.json(profile ?? {});
      }
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 200 },
      );
    }

    const result = await db
      .update(userTable)
      .set(updates)
      .where(eq(userTable.id, user.id))
      .returning({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        image: userTable.image,
        bio: userTable.bio,
        timezone: userTable.timezone,
        locale: userTable.locale,
        role: userTable.role,
      });

    const [profile] = result;

    return NextResponse.json({
      message: 'Profile updated',
      profile,
    });
  } catch (error) {
    console.error('PATCH /api/profile error:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
