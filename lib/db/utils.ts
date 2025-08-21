import { generateId } from 'ai';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Shared database connection configuration
const CONNECTION_CONFIG = {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
};

// Create a shared database connection for API routes
export function createDbConnection() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, CONNECTION_CONFIG);
  return drizzle(connection);
}

// Create a database connection for scripts (with fewer connections)
export function createScriptDbConnection() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, {
    max: 2,
    idle_timeout: 10,
    max_lifetime: 60 * 10,
    connect_timeout: 5,
  });
  return drizzle(connection);
}

export function generateHashedPassword(password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return hash;
}

export function generateDummyPassword() {
  const password = generateId();
  const hashedPassword = generateHashedPassword(password);

  return hashedPassword;
}
