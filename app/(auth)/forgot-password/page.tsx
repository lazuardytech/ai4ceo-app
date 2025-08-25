'use client';

import { requestResetAction, type ForgotActionState } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Form from 'next/form';
import { useActionState } from 'react';

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ForgotActionState, FormData>(requestResetAction as any, { status: 'idle' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border p-6">
        <h1 className="text-lg font-semibold mb-1">Forgot Password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your account email and we’ll send you a reset link.</p>

        <Form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <Button type="submit" className="w-full">Send Reset Link</Button>
        </Form>

        {state?.status !== 'idle' && state?.message && (
          <p className={`mt-4 text-sm ${state.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {state.message}
          </p>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Remembered it? <Link href="/login" className="underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
