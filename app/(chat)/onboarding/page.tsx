import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only for registered (non-guest) users
  if (session.user.type !== "regular") {
    redirect("/register");
  }

  // If name already set, skip onboarding
  if ((session.user.name || "").trim().length > 0) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh w-full flex items-start md:items-center justify-center p-6">
      <OnboardingForm defaultName={session.user.name ?? null} />
    </div>
  );
}

