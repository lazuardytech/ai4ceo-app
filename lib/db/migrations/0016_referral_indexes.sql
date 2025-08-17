-- Add indexes for referral system optimal performance

-- Index on referralCode for fast lookups
CREATE INDEX IF NOT EXISTS "idx_referral_code" ON "Referral" ("referralCode");

-- Index on userId for user-specific queries
CREATE INDEX IF NOT EXISTS "idx_referral_user_id" ON "Referral" ("userId");

-- Index on referralId for transaction queries
CREATE INDEX IF NOT EXISTS "idx_referral_transaction_referral_id" ON "ReferralTransaction" ("referralId");

-- Index on createdAt for transaction history ordering
CREATE INDEX IF NOT EXISTS "idx_referral_transaction_created_at" ON "ReferralTransaction" ("createdAt");

-- Index on referralCode for usage lookups
CREATE INDEX IF NOT EXISTS "idx_referral_usage_code" ON "ReferralUsage" ("referralCode");

-- Index on referrerId for referrer queries
CREATE INDEX IF NOT EXISTS "idx_referral_usage_referrer_id" ON "ReferralUsage" ("referrerId");

-- Index on referredUserId for referee queries
CREATE INDEX IF NOT EXISTS "idx_referral_usage_referred_user_id" ON "ReferralUsage" ("referredUserId");

-- Index on status for filtering usage records
CREATE INDEX IF NOT EXISTS "idx_referral_usage_status" ON "ReferralUsage" ("status");

-- Index on isActive for config queries
CREATE INDEX IF NOT EXISTS "idx_referral_config_active" ON "ReferralConfig" ("isActive");