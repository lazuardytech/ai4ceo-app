import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { ChatPageShell } from '@/components/chat-page-shell';
import { getDefaultChatModelId } from '@/lib/ai/models.server';
import { generateCUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { redirect } from 'next/navigation';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.onboarded) {
    redirect('/onboarding');
  }

  const active = await getActiveSubscriptionByUserId({ userId: session.user.id! });
  if (!active) {
    redirect('/billing');
  }

  const id = generateCUID();

  const chatSession = {
    user: {
      id: session.user.id!,
      email: session.user.email!,
      role: (['user', 'admin'].includes(
        (session.user as any).role,
      )
        ? ((session.user as any).role as 'user' | 'admin')
        : 'user'),
      name: (session.user as any).name ?? null,
      image: (session.user as any).image ?? null,
      type: 'regular' as const,
    },
  } as const;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model-small');

  const defaultModel = await getDefaultChatModelId();
  const initialModel = modelIdFromCookie ? modelIdFromCookie.value : defaultModel;
  const showBanner = !((session.user as any).tour);

  return (
    <>
      <ChatPageShell
        showBanner={showBanner}
        id={id}
        initialModel={initialModel}
        session={chatSession as any}
      />
      <DataStreamHandler />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Chat',
  openGraph: {
    images: [{ url: '/og?title=Chat' }],
  },
  twitter: {
    images: [{ url: '/og?title=Chat' }],
  },
};
