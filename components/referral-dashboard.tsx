'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { ReferralCodeDisplay } from './referral-code-display';
import { ReferralStats } from './referral-stats';
import { TransactionHistory } from './transaction-history';

interface ReferralData {
  referralCode: string;
  bonusBalance: string;
  totalEarned: string;
  totalReferrals: string;
  isActive: boolean;
}

interface ReferralConfig {
  benefitType: 'free_subscription' | 'discount_percentage' | 'bonus_credits';
  benefitValue: string;
  planId?: string | null;
  discountPercentage?: string | null;
  validityDays?: string | null;
  isActive: boolean;
}

export function ReferralDashboard() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch referral data and config in parallel
        const [referralResponse, configResponse] = await Promise.all([
          fetch('/api/referral'),
          fetch('/api/referral').catch(() => null), // Config might not be accessible to regular users
        ]);

        if (!referralResponse.ok) {
          throw new Error('Failed to fetch referral data');
        }

        const referralData = await referralResponse.json();
        setReferralData(referralData);

        // Only set config if the request was successful (user might not be admin)
        if (configResponse?.ok) {
          const configData = await configResponse.json();
          setConfig(configData);
        }
      } catch (error) {
        setError('Failed to load referral dashboard');
        console.error('Error fetching referral data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBenefitDescription = () => {
    if (!config) return 'Refer friends and earn rewards!';

    switch (config.benefitType) {
      case 'free_subscription':
        return `Refer friends and both of you get a free subscription!`;
      case 'discount_percentage':
        return `Refer friends and both of you get ${config.discountPercentage}% discount on subscriptions!`;
      case 'bonus_credits': {
        const amount = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(Number.parseFloat(config.benefitValue));
        return `Refer friends and earn ${amount} in bonus credits!`;
      }
      default:
        return 'Refer friends and earn rewards!';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !referralData) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="size-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error || 'Failed to load referral data'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-lg text-muted-foreground">
          {getBenefitDescription()}
        </p>
      </div>

      {/* Referral Code Display */}
      <ReferralCodeDisplay referralCode={referralData.referralCode} />

      {/* Statistics */}
      <ReferralStats
        bonusBalance={referralData.bonusBalance}
        totalEarned={referralData.totalEarned}
        totalReferrals={referralData.totalReferrals}
        isActive={referralData.isActive}
      />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
}
