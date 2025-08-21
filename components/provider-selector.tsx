'use client';

import { Button } from './ui/button';

type ProviderPreference = 'balance' | 'groq' | 'openrouter';

// Disabled provider selector - always returns Groq
export function ProviderSelector({
  value,
  onChange,
  className,
  ...props
}: {
  value: ProviderPreference;
  onChange: (pref: ProviderPreference) => void;
} & React.ComponentProps<typeof Button>) {
  // Force Groq preference and notify parent if different
  if (value !== 'groq') {
    setTimeout(() => onChange('groq'), 0);
  }

  return (
    <Button
      variant="outline"
      disabled
      className={className}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Groq Only</span>
      </div>
    </Button>
  );
}
