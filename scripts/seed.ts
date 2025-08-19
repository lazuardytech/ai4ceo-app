import { auth } from '@/lib/auth';
import { reset } from "drizzle-seed";
import * as schema from "@/lib/db/schema";
import { db } from '@/lib/db';

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL missing');

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
