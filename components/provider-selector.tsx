'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { ProviderPreference } from '@/lib/ai/providers';

export function ProviderSelector({
  value,
  onChange,
  // @ts-ignore
  className,
  ...props
}: {
  value: ProviderPreference;
  onChange: (pref: ProviderPreference) => void;
} & React.ComponentProps<typeof Select>) {
  return (
    <Select value={value} onValueChange={onChange} {...props}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="groq">Groq</SelectItem>
        <SelectItem value="vertex">Google Vertex</SelectItem>
      </SelectContent>
    </Select>
  );
}
