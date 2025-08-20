// import 'server-only';

// import { db } from '@/lib/db';
// import { session, user as userTable } from '@/lib/db/schema';
// import { and, eq, gt } from 'drizzle-orm';
// import { auth as betterAuth } from '@/lib/auth'
// import { headers } from 'next/headers';
// // import { getSession } from '@/lib/auth-client';

// export type UserType = 'guest' | 'regular';

// export interface SessionLike {
//   user: {
//     id: string;
//     email: string;

// }

// async function findUserBySessionToken(token: string) {
//   const now = new Date();
//   const [sess] = await db
//     .select()
//     .from(session)
//     .where(and(eq(session.token, token), gt(session.expiresAt, now)))
//     .limit(1);

//   if (!sess) return null;

//   const [u] = await db
//     .select({
//       id: userTable.id,
//       email: userTable.email,
//       name: userTable.name,
//       image: userTable.image,
//       role: userTable.role,
//     })
//     .from(userTable)
//     .where(eq(userTable.id, sess.userId))
//     .limit(1);

//   return u ?? null;
// }

// // export async function auth(): Promise<SessionLike | null> {
// export async function auth() {
//   const token = await betterAuth.api.getSession({
//     headers: await headers()
//   });

//   console.log(token, 'ini token')

//   // if (!token) return null;
//   // // const u = await findUserBySessionToken(token.data?.session.token || '');
//   // const u = { test: 'test' }
//   // if (!u) return null;
//   // return { user: { ...u, type: 'regular' } };
// }
