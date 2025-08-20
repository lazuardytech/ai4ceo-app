import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/referral-dashboard';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'Referral',
  openGraph: {
    images: [{ url: '/og?title=Referral&subtitle=Invite%20friends%20and%20earn%20rewards&emoji=%F0%9F%8E%81&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Referral&subtitle=Invite%20friends%20and%20earn%20rewards&emoji=%F0%9F%8E%81&theme=brand' }],
  },
};
