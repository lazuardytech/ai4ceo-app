'use client'

import steps from '@/lib/tour';
import { NextStepProvider, NextStep } from 'nextstepjs';

export default function TourProvider({ children }: {
  children: React.ReactNode;
}) {
  return (
    <NextStepProvider>
      <NextStep steps={steps}>
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
