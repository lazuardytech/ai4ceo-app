'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { login as loginAction } from '@/app/(auth)/actions';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, formAction] = useActionState(loginAction, { status: 'idle' } as any);

  useEffect(() => {
    if (!state) return;
    if (state.status === 'success') {
      setIsSuccessful(true);
      router.push('/');
    }
  }, [state, router]);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    setEmail(email);
    await formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm underline text-muted-foreground hover:text-foreground">Forgot password?</Link>
          </div>
          {state?.status === 'invalid_credentials' && (
            <p className="text-sm text-red-600 dark:text-red-400">
              <span className='font-semibold capitalize'>
                {state.errorCode || 'Unauthorized'}
              </span>
              {state.errorMessage ? `: ${state.errorMessage}` : ''}
            </p>
          )}
          {state?.status === 'failed' && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Login failed. Please try again.</p>
          )}
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
