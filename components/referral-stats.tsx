'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { IconReplaceUser, IconTrendingUp, IconWallet } from '@tabler/icons-react';

interface ReferralStatsProps {
  bonusBalance: string;
  totalEarned: string;
  totalReferrals: string;
  isActive: boolean;
  className?: string;
}

export function ReferralStats({
  bonusBalance,
  totalEarned,
  totalReferrals,
  isActive,
  className,
}: ReferralStatsProps) {
  const formatCurrency = (amount: string) => {
    const value = Number.parseFloat(amount);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      title: 'Current Balance',
      value: formatCurrency(bonusBalance),
      description: 'Available bonus credits',
      icon: IconWallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Earned',
      value: formatCurrency(totalEarned),
      description: 'Lifetime referral earnings',
      icon: IconTrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Referrals',
      value: totalReferrals,
      description: "Friends you've referred",
      icon: IconReplaceUser,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className={cn('border rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-medium">
          Referral Statistics
        </span>
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-lg border bg-white">
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`size-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {/*<p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>*/}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="mt-4 space-y-2">
        <div>
          <h2 className="text-base font-medium">How it works</h2>
          <span className='text-sm text-muted-foreground'>
            Earn rewards by referring friends to our platform
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="size-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            <p>Share your referral code with friends</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="size-2 rounded-full bg-green-500 mt-2 shrink-0" />
            <p>When they sign up, both of you receive benefits</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="size-2 rounded-full bg-purple-500 mt-2 shrink-0" />
            <p>Use your bonus balance for subscription discounts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
