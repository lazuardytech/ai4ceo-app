'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { chatModels } from '@/lib/ai/models';

type OpenRouterModel = { id: string; name: string; description?: string };

const managedIds = [
  'chat-model',
  'chat-model-small',
  'chat-model-large',
  'chat-model-reasoning',
  'title-model',
  'artifact-model',
];

// Default OpenRouter model IDs that match provider defaults
const DEFAULT_MODEL_MAP: Record<string, string> = {
  'chat-model': 'moonshotai/kimi-k2:free',
  'chat-model-small': 'moonshotai/kimi-k2:free',
  'chat-model-large': 'moonshotai/kimi-k2:free',
  'chat-model-reasoning': 'deepseek/deepseek-r1:free',
  'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
  'artifact-model': 'moonshotai/kimi-k2:free',
};

function friendlyName(id: string) {
  const fromList = chatModels.find((m) => m.id === id);
  if (fromList) return fromList.name;
  if (id === 'title-model') return 'Title Model';
  if (id === 'artifact-model') return 'Artifact Model';
  if (id === 'chat-model') return 'Default Chat Model';
  return id;
}

export default function AdminModelsPanel() {
  const {
    data: openRouterList,
    isLoading: loadingModels,
    mutate: refreshModels,
  } = useSWR<{ models: OpenRouterModel[] }>(
    '/admin/api/models/openrouter',
    fetcher,
  );
  const { data: settings } = useSWR<Record<string, any>>(
    '/admin/api/settings',
    fetcher,
  );

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const models = useMemo(
    () => openRouterList?.models ?? ([] as OpenRouterModel[]),
    [openRouterList?.models],
  );

  // Update overrides from settings only when the value actually changes
  const overridesFromSettings = useMemo(
    () =>
      (settings?.modelOverrides as Record<string, string> | undefined) ??
      undefined,
    [settings?.modelOverrides],
  );
  useEffect(() => {
    if (overridesFromSettings) {
      setOverrides(overridesFromSettings);
    } else if (Object.keys(overrides).length === 0) {
      // If no saved overrides, prefill with defaults once
      setOverrides(DEFAULT_MODEL_MAP);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overridesFromSettings]);

  const modelOptions = useMemo(
    () => models.map((m) => ({ value: m.id, label: m.name || m.id })),
    [models],
  );

  async function handleSave() {
    const form = new FormData();
    form.set('key', 'modelOverrides');
    form.set('value', JSON.stringify(overrides, null, 2));
    const res = await fetch('/admin/api/settings', {
      method: 'POST',
      body: form,
    });
    if (res.ok) {
      alert('Saved');
    } else {
      alert('Failed to save');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Model Mappings (OpenRouter)</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refreshModels()}>
              Refresh
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingModels && (
          <div className="text-sm text-muted-foreground">Loading models…</div>
        )}
        {!loadingModels && models.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No models found or OpenRouter key missing.
          </div>
        )}
        {managedIds.map((id) => (
          <div key={id} className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">{friendlyName(id)}</Label>
            <Select
              value={
                overrides[id] &&
                modelOptions.some((o) => o.value === overrides[id])
                  ? overrides[id]
                  : modelOptions.some((o) => o.value === DEFAULT_MODEL_MAP[id])
                    ? DEFAULT_MODEL_MAP[id]
                    : ''
              }
              onValueChange={(v) =>
                setOverrides((prev) => ({ ...prev, [id]: v }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select OpenRouter model" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {modelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
