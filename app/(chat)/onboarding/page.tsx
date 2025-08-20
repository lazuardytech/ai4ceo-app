import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Metadata } from 'next';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/login");
  }

  // If already onboarded, skip onboarding
  if (session.user.onboarded) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh w-full flex items-start md:items-center justify-center p-6">
      <OnboardingForm defaultName={session.user.name ?? null} />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Onboarding',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Onboarding' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Onboarding' }],
  },
};
