"use client";

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export const SignOutForm = () => {
  const router = useRouter();
  return (
    <button
      type="button"
      className="w-full text-left px-1 py-0.5 text-red-500"
      onClick={() => {
        authClient.signOut().finally(() => {
          router.push('/');
          router.refresh();
        });
      }}
    >
      Sign out
    </button>
  );
};
