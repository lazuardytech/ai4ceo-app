import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/referral-dashboard';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function ReferralPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <ReferralDashboard />
      </main>
    </div>
  );
}
