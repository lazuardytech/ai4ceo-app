import { ChatSDKError } from "@/lib/errors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { setting as settingTable, user as userTable } from "@/lib/db/schema";
import { getSession } from "@/lib/auth-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Body = {
  name?: string;
  traits?: string[];
};

function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not configured.");
  const sql = postgres(url);
  const db = drizzle(sql);
  return { db, sql };
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) return new ChatSDKError("unauthorized:auth").toResponse();
  // if (session.user.type !== "regular") return new ChatSDKError("forbidden:auth").toResponse();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const name = (body.name || "").trim();
  const traits = Array.isArray(body.traits) ? body.traits : [];

  const { db, sql } = getDb();
  try {
    // Update display name if provided and mark as onboarded
    const updateUser: Record<string, any> = { onboarded: true };
    if (name.length > 0) updateUser.name = name;
    await db
      .update(userTable)
      .set(updateUser)
      .where(eq(userTable.id, session.user.id));

    // Persist preferences in settings as a JSON blob
    const key = `user:${session.user.id}:preferences`;
    const now = new Date();
    const value = { botTraits: traits, onboarded: true } as any;

    // Upsert-style: try update; if 0 rows, insert
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

    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/onboarding error:", e);
    return new ChatSDKError("bad_request:api").toResponse();
  } finally {
    await sql.end({ timeout: 1 });
  }
}
