'use server';

import { z } from 'zod';

import {
  createUser,
  getUser,
  reserveReferralUsage,
} from '@/lib/db/queries';
import { auth } from '@/lib/auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  referralCode: z.string().optional(),
});

export interface LoginActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'invalid_credentials';
  errorCode?: string;
  errorMessage?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    try {
      await auth.api.signInEmail({
        body: {
          email: validatedData.email,
          password: validatedData.password,
        },
      });
    } catch (e: any) {
      const status = e?.status || e?.response?.status;
      const code = e?.code || e?.data?.code || e?.response?.data?.code;
      const message = e?.message || e?.data?.message || e?.response?.statusText || 'Login failed';
      if (status === 401) {
        return { status: 'invalid_credentials', errorCode: String(code || 'unauthorized'), errorMessage: String(message) } as LoginActionState;
      }
      const msg = (e && (e.message || e?.toString?.())) || '';
      if (typeof msg === 'string' && /invalid|credential|unauthor/i.test(msg)) {
        return { status: 'invalid_credentials', errorCode: String(code || 'unauthorized'), errorMessage: String(message) } as LoginActionState;
      }
      // Unknown failure
      return { status: 'failed', errorMessage: String(message) } as LoginActionState;
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
  | 'idle'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'user_exists'
  | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      referralCode: formData.get('referralCode') || undefined,
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // Create the user first
    await createUser(validatedData.email, validatedData.password);

    // Get the newly created user to get their ID
    const [newUser] = await getUser(validatedData.email);

    // Reserve referral code if provided (benefits applied on subscription)
    if (validatedData.referralCode?.trim()) {
      try {
        await reserveReferralUsage({
          referralCode: validatedData.referralCode.trim().toUpperCase(),
          newUserId: newUser.id,
        });
      } catch (referralError) {
        // Log the error but don't fail the registration
        console.error('Failed to apply referral code:', referralError);
      }
    }

    await auth.api.signInEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
