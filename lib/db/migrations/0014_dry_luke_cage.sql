ALTER TABLE "User" ADD COLUMN "name" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "timezone" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "locale" varchar(16);