ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" varchar NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS "Setting" (
  "key" varchar(128) PRIMARY KEY NOT NULL,
  "value" json NOT NULL,
  "updatedAt" timestamp NOT NULL
);
