import { cookies, headers } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { redirect } from 'next/navigation';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const active = await getActiveSubscriptionByUserId({ userId: session?.user.id! });
  console.log(active, 'ini active')
  if (!active) {
    redirect('/billing');
  }

  const id = generateUUID();

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
          session={{ user: { ...session?.user, type: 'regular' } }}
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
        session={{ user: { ...session?.user, type: 'regular' } }}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
