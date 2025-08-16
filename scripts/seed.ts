import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateHashedPassword } from '../lib/db/utils';

config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL missing');
  const db = drizzle(postgres(process.env.POSTGRES_URL, { max: 1 }));

  const seeding = [
    {
      email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@example.com',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'superadmin123',
      role: 'superadmin' as const,
    },
    {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'admin12345',
      role: 'admin' as const,
    },
  ];

  for (const s of seeding) {
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, s.email))
      .limit(1);
    if (existing) {
      await db
        .update(user)
        .set({ role: s.role })
        .where(eq(user.id, existing.id));
      console.log(`Updated role for ${s.email} -> ${s.role}`);
    } else {
      const hashedPassword = generateHashedPassword(s.password);
      await db
        .insert(user)
        .values({ email: s.email, password: hashedPassword, role: s.role });
      console.log(`Created ${s.role} ${s.email}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
