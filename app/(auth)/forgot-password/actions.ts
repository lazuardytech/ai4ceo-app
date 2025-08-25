'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export interface ForgotActionState {
  status: 'idle' | 'success' | 'invalid_data' | 'failed';
  message?: string;
}

export async function requestResetAction(
  _prev: ForgotActionState | undefined,
  formData: FormData,
): Promise<ForgotActionState> {
  try {
    const parsed = schema.parse({ email: String(formData.get('email') || '') });

    const base = process.env.APP_BASE_URL || '';
    const redirectTo = `${base || ''}/reset-password`;
    await auth.api.requestPasswordReset({ body: { email: parsed.email, redirectTo } });

    return { status: 'success', message: 'If the email exists, a reset link has been sent.' };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { status: 'invalid_data', message: e.issues?.[0]?.message || 'Invalid email' };
    }
    const msg = e?.message || 'Failed to request reset';
    return { status: 'failed', message: String(msg) };
  }
}

