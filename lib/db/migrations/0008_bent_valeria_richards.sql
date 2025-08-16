CREATE TABLE IF NOT EXISTS "Setting" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar DEFAULT 'user' NOT NULL;