import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { reset } from "drizzle-seed";
import * as schema from "@/lib/db/schema";

config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL missing');

  const db = drizzle(postgres(process.env.POSTGRES_URL, { max: 1 }));
  await reset(db, schema);

  const seeding = [
    {
      name: 'Super Admin',
      email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@example.com',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'superadmin123',
      role: 'superadmin' as const,
    },
    {
      name: 'Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'admin12345',
      role: 'admin' as const,
    },
  ];

  for (const s of seeding) {
    // const [existing] = await db
    //   .select()
    //   .from(user)
    //   .where(eq(user.email, s.email))
    //   .limit(1);
    // if (existing) {
    //   await db
    //     .update(user)
    //     .set({ role: s.role })
    //     .where(eq(user.id, existing.id));
    //   console.log(`Updated role for ${s.email} -> ${s.role}`);
    // } else {

    // await db
    //   .insert(user)
    //   .values({ email: s.email, password: hashedPassword, role: s.role });
    const res = await auth.api.signUpEmail({
      body: {
        email: s.email,
        password: s.password,
        name: s.name,
        role: s.role,
      },
    })
    console.log(res, `Created ${s.role} ${s.email}`);
  }
  // }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
