'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import Form from 'next/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { resetPasswordAction, type ResetActionState } from './actions';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [state, formAction] = useActionState<ResetActionState, FormData>(resetPasswordAction as any, { status: 'idle' });
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    if (state?.status === 'success') {
      // Redirect to login after a short delay
      const t = setTimeout(() => router.push('/login'), 800);
      return () => clearTimeout(t);
    }
  }, [state?.status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border p-6">
        <h1 className="text-lg font-semibold mb-1">Reset Password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter a new password for your account.</p>

        <Form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">Reset Password</Button>
        </Form>

        {state?.status !== 'idle' && state?.message && (
          <p className={`mt-4 text-sm ${state.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {state.message}
          </p>
        )}

        {!token && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">Missing or invalid reset token.</p>
        )}
      </div>
    </div>
  );
}
