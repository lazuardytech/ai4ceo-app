import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema';

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL missing');

  // Skip if any user already exists
  const existing = await db.select().from(userTable).limit(1);
  if (existing.length > 0) {
    console.log('Users already present; skipping seeding.');
    process.exit(0);
  }

  // await reset(db, schema);

  const seeding = [
    {
      name: 'Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@ai4.ceo',
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
