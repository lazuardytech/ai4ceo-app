import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/referral-dashboard';
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
      <main className="flex-1 container mx-auto max-w-3xl">
        <ReferralDashboard />
      </main>
    </div>
  );
}
