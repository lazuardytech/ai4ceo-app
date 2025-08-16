CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"planId" varchar(64) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"externalId" varchar(128),
	"providerInvoiceId" varchar(128),
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"currentPeriodEnd" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
