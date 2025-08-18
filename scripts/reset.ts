import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { reset } from "drizzle-seed";
import * as schema from "@/lib/db/schema";
import '@/lib/env-config'

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL missing');

  const db = drizzle(postgres(process.env.POSTGRES_URL, { max: 1 }));
  await reset(db, schema);

  console.log(`✅ Database reset successfully`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
