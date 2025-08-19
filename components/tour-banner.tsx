"use client";

import { useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNextStep } from 'nextstepjs';
import { toast } from 'sonner';

type Props = {
  visible: boolean;
};

export function TourBanner({ visible }: Props) {
  const [show, setShow] = useState(visible);
  const { startNextStep } = useNextStep();

  const markTour = useCallback(async (val: boolean) => {
    try {
      await fetch('/api/tour', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour: val }),
      });
    } catch (e) {
      console.warn('Failed to update tour flag');
    }
  }, []);

  const onStart = useCallback(() => {
    // Start the tour and mark as done so banner won't reappear
    startNextStep('first-time');
    void markTour(true);
    setShow(false);
  }, [markTour, startNextStep]);

  const onClose = useCallback(() => {
    setShow(false);
    void markTour(true);
    toast.success('Tour dismissed. You can restart it from Settings.');
  }, [markTour]);

  if (!show) return null;

  return (
    <div className="sticky top-0 z-30 w-full mb-1">
      <Alert className="rounded-none relative flex items-center justify-between border-none bg-muted-foreground/5 text-foreground p-3">
        <div className='flex flex-col min-w-0'>
          <AlertTitle className='text-sm'>Take a quick tour?</AlertTitle>
          <AlertDescription className='text-muted-foreground text-xs truncate'>
            Explore the app with a short guided tour. You can restart the tour any time from Settings.
          </AlertDescription>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Button size="sm" variant="ghost" onClick={onClose}>Maybe later</Button>
          <Button size="sm" variant="outline" onClick={onStart}>Start Tour</Button>
        </div>
      </Alert>
    </div>
  );
}
