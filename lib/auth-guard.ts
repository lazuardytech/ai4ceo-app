"use server";

import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt } from 'drizzle-orm';

import { db } from './db';
import { session, user as userTable } from './db/schema';
import { auth } from './auth';

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role: 'user' | 'admin' | 'superadmin';
  onboarded?: boolean;
};

async function findUserBySessionToken(token: string) {
  const now = new Date();
  const [sess] = await db
    .select()
    .from(session)
    .where(and(eq(session.token, token), gt(session.expiresAt, now)))
    .limit(1);

  if (!sess) return null;

  const [u] = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      image: userTable.image,
      role: userTable.role,
    })
    .from(userTable)
    .where(eq(userTable.id, sess.userId))
    .limit(1);

  return u ?? null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const data = await auth.api.getSession({
    headers: await headers()
  })

  if (!data?.session?.token) return null;
  const user = await findUserBySessionToken(data.session.token);

  return user as CurrentUser;
}

export async function requireAuth(): Promise<CurrentUser> {
  const data = await auth.api.getSession({
    headers: await headers()
  })

  if (data?.session?.token) {
    const user = await findUserBySessionToken(data.session.token);
    if (user) return user as CurrentUser;
  }

  redirect('/login');
}

export async function requireSuperadmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== 'superadmin') redirect('/');
  return user;
}

export async function ensureOnboarded(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!user.onboarded) {
    redirect('/onboarding');
  }
  return user;
}
