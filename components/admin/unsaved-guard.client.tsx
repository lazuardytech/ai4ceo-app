'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function UnsavedGuard({ selector = 'form' }: { selector?: string }) {
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const forms = Array.from(document.querySelectorAll<HTMLFormElement>(selector));
    const markDirty = () => setDirty(true);
    forms.forEach((f) => {
      f.addEventListener('change', markDirty);
      f.addEventListener('input', markDirty);
    });
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const onClick = (e: MouseEvent) => {
      if (!dirty) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const anchor = t.closest('a') as HTMLAnchorElement | null;
      if (anchor?.href && anchor.target !== '_blank' && !anchor.download) {
        e.preventDefault();
        setPendingHref(anchor.href);
        setOpen(true);
      }
    };
    document.addEventListener('click', onClick);
    return () => {
      forms.forEach((f) => {
        f.removeEventListener('change', markDirty);
        f.removeEventListener('input', markDirty);
      });
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick);
    };
  }, [selector, dirty]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave this page, your changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingHref(null)}>
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const href = pendingHref;
              setPendingHref(null);
              setOpen(false);
              setDirty(false);
              if (href) window.location.href = href;
            }}
          >
            Leave page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
