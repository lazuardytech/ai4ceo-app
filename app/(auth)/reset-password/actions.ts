'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';

const resetSchema = z.object({
  token: z.string().min(1, 'Missing token'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export interface ResetActionState {
  status: 'idle' | 'success' | 'invalid_data' | 'failed';
  message?: string;
}

export async function resetPasswordAction(
  _prev: ResetActionState | undefined,
  formData: FormData,
): Promise<ResetActionState> {
  try {
    const parsed = resetSchema.parse({
      token: String(formData.get('token') || ''),
      newPassword: String(formData.get('newPassword') || ''),
      confirmPassword: String(formData.get('confirmPassword') || ''),
    });

    await auth.api.resetPassword({
      body: { newPassword: parsed.newPassword, token: parsed.token },
    });

    return { status: 'success', message: 'Password has been reset. You can sign in now.' };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { status: 'invalid_data', message: e.issues?.[0]?.message || 'Invalid input' };
    }
    const msg = e?.message || 'Failed to reset password';
    return { status: 'failed', message: String(msg) };
  }
}

