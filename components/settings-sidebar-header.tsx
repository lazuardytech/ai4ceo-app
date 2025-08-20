'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type Profile = {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
};

export function SettingsSidebarHeader(props: {
  initialId: string;
  initialEmail: string;
  initialName?: string | null;
  initialImage?: string | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (!res.ok) return; // fall back to initial
        const data = (await res.json()) as any;
        if (!cancelled) setProfile({ id: data.id, email: data.email, name: data.name, image: data.image });
      } catch { }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const name = (profile?.name ?? props.initialName ?? props.initialEmail) as string;
  const email = (profile?.email ?? props.initialEmail) as string;
  const id = (profile?.id ?? props.initialId) as string;
  const image = (profile?.image ?? props.initialImage ?? '').trim();

  const avatarSrc = useMemo(() => {
    return image && image.length > 0
      ? image
      : `https://avatar.vercel.sh/${encodeURIComponent(email || id)}`;
  }, [image, email, id]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-40 rounded-full overflow-hidden bg-muted">
        <Image src={avatarSrc} alt={name || 'User avatar'} width={160} height={160} />
      </div>
      <div className="min-w-0 items-center text-center flex flex-col gap-1">
        <div className="text-lg font-medium truncate">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{email}</div>
      </div>
    </div>
  );
}
