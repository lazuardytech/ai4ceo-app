import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReferralConfigPanel } from '@/components/referral-config-panel';
import { headers } from 'next/headers';

export default async function AdminReferralPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="space-y-4">
      <ReferralConfigPanel />
    </div>
  );
}
