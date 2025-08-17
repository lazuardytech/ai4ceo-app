CREATE TABLE IF NOT EXISTS "Referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"referralCode" varchar(32) NOT NULL,
	"bonusBalance" varchar(16) DEFAULT '0' NOT NULL,
	"totalEarned" varchar(16) DEFAULT '0' NOT NULL,
	"totalReferrals" varchar(16) DEFAULT '0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Referral_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferralConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benefitType" varchar DEFAULT 'bonus_credits' NOT NULL,
	"benefitValue" varchar(16) NOT NULL,
	"planId" varchar(64),
	"discountPercentage" varchar(8),
	"validityDays" varchar(8),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferralTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referralId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"amount" varchar(16) NOT NULL,
	"description" text NOT NULL,
	"relatedUserId" uuid,
	"subscriptionId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferralUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referralCode" varchar(32) NOT NULL,
	"referrerId" uuid NOT NULL,
	"referredUserId" uuid NOT NULL,
	"bonusAmount" varchar(16) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Referral" ADD CONSTRAINT "Referral_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralTransaction" ADD CONSTRAINT "ReferralTransaction_referralId_Referral_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralTransaction" ADD CONSTRAINT "ReferralTransaction_relatedUserId_User_id_fk" FOREIGN KEY ("relatedUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralTransaction" ADD CONSTRAINT "ReferralTransaction_subscriptionId_Subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referredUserId_User_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
