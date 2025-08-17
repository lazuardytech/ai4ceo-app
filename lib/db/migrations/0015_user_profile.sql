-- Add profile fields to User table

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "name" varchar(128);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "image" text;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "bio" text;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "timezone" varchar(64);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "locale" varchar(16);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
