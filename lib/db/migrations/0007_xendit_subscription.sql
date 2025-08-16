CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "planId" varchar(64) NOT NULL,
  "status" varchar NOT NULL DEFAULT 'pending',
  "externalId" varchar(128),
  "providerInvoiceId" varchar(128),
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  "currentPeriodEnd" timestamp
);
