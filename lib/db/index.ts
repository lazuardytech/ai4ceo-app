import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
export const db = drizzle(connection);
