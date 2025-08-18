import { cookies, headers } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
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
      role: (['user', 'admin', 'superadmin'].includes(
        (session.user as any).role,
      )
        ? ((session.user as any).role as 'user' | 'admin' | 'superadmin')
        : 'user'),
      name: (session.user as any).name ?? null,
      image: (session.user as any).image ?? null,
      type: 'regular' as const,
    },
  } as const;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model-small');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={chatSession as any}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={chatSession as any}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
