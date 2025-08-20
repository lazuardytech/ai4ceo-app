"use client";

import { useEffect, useRef, useState } from 'react';
import { Chat } from '@/components/chat';
import { TourBanner } from '@/components/tour-banner';

type UserSession = {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    name?: string | null;
    image?: string | null;
    type: 'guest' | 'regular';
  };
};

export function ChatPageShell({
  showBanner,
  id,
  initialModel,
  session,
}: {
  showBanner: boolean;
  id: string;
  initialModel: string;
  session: UserSession;
}) {
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState<number>(showBanner ? 60 : 0);

  useEffect(() => {
    function computeOffset() {
      if (!showBanner || !bannerRef.current) {
        setOffset(0);
        return;
      }
      const el = bannerRef.current;
      let h = el.offsetHeight;
      const styles = window.getComputedStyle(el);
      const mt = parseFloat(styles.marginTop || '0');
      const mb = parseFloat(styles.marginBottom || '0');
      h += mt + mb;
      setOffset(Math.max(0, Math.round(h)));
    }

    computeOffset();

    const ro = new ResizeObserver(() => computeOffset());
    if (bannerRef.current) ro.observe(bannerRef.current);

    const onResize = () => computeOffset();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [showBanner]);

  return (
    <>
      {showBanner && (
        <div ref={bannerRef}>
          <TourBanner visible={true} />
        </div>
      )}
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialModel}
        initialVisibilityType="private"
        isReadonly={false}
        session={session as any}
        autoResume={false}
        heightOffset={offset}
      />
    </>
  );
}
