import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ReferralConfigPanel } from '@/components/referral-config-panel';

export default async function AdminReferralPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'superadmin') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral System Configuration</h1>
        <p className="text-muted-foreground">
          Configure referral program benefits and settings.
        </p>
      </div>

      <ReferralConfigPanel />
    </div>
  );
}
