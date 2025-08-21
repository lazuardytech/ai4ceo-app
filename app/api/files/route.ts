import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-guard';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { userFile, chat, message } from '@/lib/db/schema';
import { createDbConnection } from '@/lib/db/utils';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

function getDb() {
  const db = createDbConnection();
  return { db };
}

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

/**
 * GET /api/files
 * Lists current user's uploaded files (not deleted by default).
 * Optional query params:
 * - includeDeleted=1 to include deleted items
 * - limit (default 100)
 * - offset (default 0)
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === '1';
    const limit = Math.max(
      0,
      Math.min(500, Number(url.searchParams.get('limit') || 100)),
    );
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));

    const { db } = getDb();

    const rows = await db
      .select({
        id: userFile.id,
        name: userFile.name,
        url: userFile.url,
        contentType: userFile.contentType,
        size: userFile.size,
        storagePath: userFile.storagePath,
        isDeleted: userFile.isDeleted,
        createdAt: userFile.createdAt,
        updatedAt: userFile.updatedAt,
      })
      .from(userFile)
      .where(
        includeDeleted
          ? eq(userFile.userId, user.id)
          : and(eq(userFile.userId, user.id), eq(userFile.isDeleted, false)),
      )
      .orderBy(desc(userFile.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ files: rows });
  } catch (err: any) {
    console.error('GET /api/files error:', err);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

/**
 * DELETE /api/files
 * Deletes a user file by id, removes its object from storage,
 * and scrubs references from user's messages.
 *
 * Request body (JSON):
 * { "id": "uuid-of-userfile" }
 */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let id: string | undefined;

  try {
    const body = await request.json().catch(() => null);
    id = body?.id;
  } catch {
    // ignore parse error, will validate below
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing "id" in request body' }, { status: 400 });
  }

  try {
    const { db } = getDb();

    // 1) Find the file and validate ownership
    const [file] = await db
      .select()
      .from(userFile)
      .where(and(eq(userFile.id, id), eq(userFile.userId, user.id)));

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 2) Attempt to delete from R2 (if configured and we have a storage path)
    let storageDeleted = false;
    const key = file.storagePath ?? '';

    if (key) {
      try {
        const {
          R2_BUCKET_NAME,
        } = process.env as Record<string, string | undefined>;

        if (!R2_BUCKET_NAME) {
          throw new Error('R2_BUCKET_NAME is not configured.');
        }

        const r2 = getR2Client();
        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          }),
        );
        storageDeleted = true;
      } catch (e) {
        // We will continue to scrub references and mark as deleted even if storage deletion fails.
        console.warn('R2 deletion failed (continuing):', e);
      }
    }

    // 3) Scrub references from user's messages
    // Find all chat ids for this user
    const chats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, user.id));

    const chatIds = chats.map((c) => c.id);
    let messagesUpdated = 0;

    if (chatIds.length > 0) {
      // Select messages that contain this file url in parts JSON
      const messagesWithFile = await db
        .select({
          id: message.id,
          parts: message.parts,
          chatId: message.chatId,
        })
        .from(message)
        .where(
          and(
            inArray(message.chatId, chatIds),
            sql`CAST(${message.parts} AS TEXT) ILIKE ${`%${file.url}%`}`
          ),
        );

      // Update messages in memory and write back only if modified
      for (const m of messagesWithFile) {
        try {
          const parts = Array.isArray(m.parts) ? (m.parts as any[]) : [];
          const filtered = parts.filter(
            (p) => !(p && p.type === 'file' && typeof p.url === 'string' && p.url === file.url),
          );

          const modified = filtered.length !== parts.length;
          if (modified) {
            await db
              .update(message)
              .set({ parts: filtered as any })
              .where(eq(message.id, m.id));
            messagesUpdated++;
          }
        } catch (e) {
          console.warn(`Failed to update message ${m.id} while scrubbing file refs:`, e);
        }
      }
    }

    // 4) Mark the user file as deleted
    await db
      .update(userFile)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(userFile.id, id));

    return NextResponse.json({
      id,
      storageDeleted,
      messagesUpdated,
      note:
        'Deleting files here removes them from your messages but does not delete the threads. If a thread still assumes this file exists, behavior may be unexpected.',
    });
  } catch (err: any) {
    console.error('DELETE /api/files error:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
