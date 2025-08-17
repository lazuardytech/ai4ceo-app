'use server';

import { z } from 'zod';

import {
  createUser,
  getUser,
  applyReferralCode,
  getReferralConfig,
} from '@/lib/db/queries';

import { signIn } from './auth';

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
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
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

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

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

    // Apply referral code if provided
    if (validatedData.referralCode && validatedData.referralCode.trim()) {
      try {
        const config = await getReferralConfig();
        let bonusAmount = '0';

        // Calculate bonus amount based on configuration
        switch (config.benefitType) {
          case 'bonus_credits':
            bonusAmount = config.benefitValue;
            break;
          case 'discount_percentage':
            bonusAmount = '5000'; // Default bonus for discount type
            break;
          case 'free_subscription':
            bonusAmount = '10000'; // Default bonus for free subscription
            break;
        }

        await applyReferralCode({
          referralCode: validatedData.referralCode.trim().toUpperCase(),
          newUserId: newUser.id,
          bonusAmount,
        });
      } catch (referralError) {
        // Log the error but don't fail the registration
        console.error('Failed to apply referral code:', referralError);
      }
    }

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
