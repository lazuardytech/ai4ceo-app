import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/referral-dashboard';

export default async function ReferralPage() {
  const session = await auth();

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
