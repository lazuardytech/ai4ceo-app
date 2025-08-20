'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { toast } from '@/components/toast';
import { signUp } from '@/lib/auth-client';
// import { auth } from '@/lib/auth';

function RegisterPageContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState(
    searchParams.get('ref') || '',
  );
  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const referral = (formData.get('referralCode') as string) || '';
    setEmail(email);
    setReferralCode(referral);
    const name = email?.split('@')[0] || 'User';
    const res = await signUp.email({ email, password, name, role: 'user', callbackURL: '/onboarding', tour: false, onboarded: false })
      .then(() => {
        toast({ type: 'success', description: 'Account created successfully!' });
        setIsSuccessful(true);
        window.location.replace('/onboarding');
      })
      .catch(() => {
        toast({ type: 'error', description: 'Failed to create account!' });
      });

    console.log(res)
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm
          action={handleSubmit}
          defaultEmail={email}
          showReferralCode={true}
          defaultReferralCode={referralCode}
        >
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
