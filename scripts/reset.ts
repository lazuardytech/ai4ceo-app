import { reset } from "drizzle-seed";
import * as schema from "@/lib/db/schema";
import { createScriptDbConnection } from "@/lib/db/utils";
import '@/lib/env-config'

async function main() {
  const db = createScriptDbConnection();
  await reset(db, schema);

  console.log(`✅ Database reset successfully`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
