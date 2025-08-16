CREATE TABLE IF NOT EXISTS "Voucher" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"type" varchar NOT NULL,
	"discountType" varchar,
	"discountValue" varchar(16),
	"planId" varchar(64),
	"duration" varchar(32),
	"maxUsages" varchar(16),
	"currentUsages" varchar(16) DEFAULT '0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"validFrom" timestamp NOT NULL,
	"validUntil" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "Voucher_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "VoucherUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucherId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"subscriptionId" uuid,
	"usedAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_voucherId_Voucher_id_fk" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_subscriptionId_Subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
