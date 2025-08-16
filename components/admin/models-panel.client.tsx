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
type GroqModel = { id: string; name: string };

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
  const { data: openRouterList, isLoading: loadingModels, mutate: refreshModels } =
    useSWR<{ models: OpenRouterModel[] }>(
      '/admin/api/models/openrouter',
      fetcher,
    );
  const { data: groqList, isLoading: loadingGroq, mutate: refreshGroq } =
    useSWR<{ models: GroqModel[] }>(
      '/admin/api/models/groq',
      fetcher,
    );
  const { data: settings } = useSWR<Record<string, any>>(
    '/admin/api/settings',
    fetcher,
  );

  const [overridesOR, setOverridesOR] = useState<Record<string, string>>({});
  const [overridesGroq, setOverridesGroq] = useState<Record<string, string>>({});
  const [providerPref, setProviderPref] = useState<'balance' | 'groq' | 'openrouter'>(
    'balance',
  );

  const models = useMemo(
    () => openRouterList?.models ?? ([] as OpenRouterModel[]),
    [openRouterList?.models],
  );
  const groqModels = useMemo(
    () => groqList?.models ?? ([] as GroqModel[]),
    [groqList?.models],
  );

  const orFromSettings = useMemo(
    () =>
      (settings?.modelOverridesOpenRouter as Record<string, string> | undefined) ??
      (settings?.modelOverrides as Record<string, string> | undefined) ??
      undefined,
    [settings?.modelOverridesOpenRouter, settings?.modelOverrides],
  );
  const groqFromSettings = useMemo(
    () => (settings?.modelOverridesGroq as Record<string, string> | undefined) ?? undefined,
    [settings?.modelOverridesGroq],
  );
  const prefFromSettings = useMemo(
    () => (settings?.defaultProviderPreference as any) ?? 'balance',
    [settings?.defaultProviderPreference],
  );

  useEffect(() => {
    if (orFromSettings) setOverridesOR(orFromSettings);
    else if (Object.keys(overridesOR).length === 0) setOverridesOR(DEFAULT_MODEL_MAP);

    if (groqFromSettings) setOverridesGroq(groqFromSettings);
    else if (Object.keys(overridesGroq).length === 0)
      setOverridesGroq({
        'chat-model': 'llama3-8b-8192',
        'chat-model-small': 'llama3-8b-8192',
        'chat-model-large': 'llama3-70b-8192',
        'chat-model-reasoning': 'llama3-70b-8192',
        'title-model': 'llama3-8b-8192',
        'artifact-model': 'llama3-8b-8192',
      });

    setProviderPref(prefFromSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orFromSettings, groqFromSettings, prefFromSettings]);

  const modelOptions = useMemo(
    () => models.map((m) => ({ value: m.id, label: m.name || m.id })),
    [models],
  );
  const groqOptions = useMemo(
    () => groqModels.map((m) => ({ value: m.id, label: m.name || m.id })),
    [groqModels],
  );

  async function handleSave() {
    // Save OpenRouter overrides
    const form = new FormData();
    form.set('key', 'modelOverridesOpenRouter');
    form.set('value', JSON.stringify(overridesOR, null, 2));
    const res = await fetch('/admin/api/settings', { method: 'POST', body: form });
    if (!res.ok) return alert('Failed to save OpenRouter mappings');

    // Save Groq overrides
    const form2 = new FormData();
    form2.set('key', 'modelOverridesGroq');
    form2.set('value', JSON.stringify(overridesGroq, null, 2));
    const res2 = await fetch('/admin/api/settings', { method: 'POST', body: form2 });
    if (!res2.ok) return alert('Failed to save Groq mappings');

    // Save default provider preference
    const form3 = new FormData();
    form3.set('key', 'defaultProviderPreference');
    form3.set('value', providerPref);
    const res3 = await fetch('/admin/api/settings', { method: 'POST', body: form3 });
    if (!res3.ok) return alert('Failed to save provider preference');

    alert('Saved');
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Model Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { refreshModels(); refreshGroq(); }}>
              Refresh Lists
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded border p-3 space-y-2">
          <div className="font-medium">Default Provider Preference</div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">Preference</Label>
            <Select value={providerPref} onValueChange={(v) => setProviderPref(v as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select provider preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Load Balance</SelectItem>
                <SelectItem value="groq">Groq Only</SelectItem>
                <SelectItem value="openrouter">OpenRouter Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded border p-3 space-y-2">
          <div className="font-medium">OpenRouter Mappings</div>
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
                  overridesOR[id] && modelOptions.some((o) => o.value === overridesOR[id])
                    ? overridesOR[id]
                    : modelOptions.some((o) => o.value === DEFAULT_MODEL_MAP[id])
                      ? DEFAULT_MODEL_MAP[id]
                      : ''
                }
                onValueChange={(v) => setOverridesOR((prev) => ({ ...prev, [id]: v }))}
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
        </div>

        <div className="rounded border p-3 space-y-2">
          <div className="font-medium">Groq Mappings</div>
          {loadingGroq && (
            <div className="text-sm text-muted-foreground">Loading models…</div>
          )}
          {!loadingGroq && groqModels.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No models found or Groq key missing.
            </div>
          )}
          {managedIds.map((id) => (
            <div key={id} className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">{friendlyName(id)}</Label>
              <Select
                value={overridesGroq[id] || ''}
                onValueChange={(v) => setOverridesGroq((prev) => ({ ...prev, [id]: v }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Groq model" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {groqOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
