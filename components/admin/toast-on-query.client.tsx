'use client';

import { useEffect } from 'react';
import { toast } from '@/components/toast';

export function ToastOnQuery() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ok = url.searchParams.get('ok');
      const msg = url.searchParams.get('msg');
      if (ok && msg) {
        toast({ type: 'success', description: decodeURIComponent(msg) });
        url.searchParams.delete('ok');
        url.searchParams.delete('msg');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);
  return null;
}

