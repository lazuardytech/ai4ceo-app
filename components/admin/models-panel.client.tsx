'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { chatModels as defaultChatModels } from '@/lib/ai/models';
import type { ChatModel } from '@/lib/ai/models';
import { BotIcon, BoxIcon, FileIcon, InfoIcon, HomeIcon, GPSIcon } from '@/components/icons';

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

function friendlyName(id: string, list?: ChatModel[]) {
  const fromList = (list || defaultChatModels).find((m) => m.id === id);
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

  // Initialize enabled chat models & default from settings
  useEffect(() => {
    const enabled = (settings?.enabledChatModelIds as string[] | undefined) ?? null;
    if (enabled && Array.isArray(enabled) && enabled.length > 0) {
      setEnabledChatModelIds(enabled);
    } else {
      setEnabledChatModelIds(defaultChatModels.map((m) => m.id));
    }

    const defId = (settings?.defaultChatModelId as string | undefined) ?? '';
    if (defId) setDefaultChatModelId(defId);
    else if (!defaultChatModelId) setDefaultChatModelId(defaultChatModels[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.enabledChatModelIds, settings?.defaultChatModelId]);

  const modelOptions = useMemo(
    () => models.map((m) => ({ value: m.id, label: m.name || m.id })),
    [models],
  );
  const groqOptions = useMemo(
    () => groqModels.map((m) => ({ value: m.id, label: m.name || m.id })),
    [groqModels],
  );

  const [banner, setBanner] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enabledChatModelIds, setEnabledChatModelIds] = useState<string[]>(defaultChatModels.map((m) => m.id));
  const [defaultChatModelId, setDefaultChatModelId] = useState<string>('');

  async function handleSave() {
    const validEnabled = enabledChatModelIds.filter((id) => !!id && defaultChatModels.some((m) => m.id === id));
    if (validEnabled.length === 0) {
      setBanner('Enable at least one chat model');
      setTimeout(() => setBanner(null), 2500);
      return;
    }
    const defExists = validEnabled.includes(defaultChatModelId);
    const finalDefault = defExists ? defaultChatModelId : validEnabled[0];

    // Save enabled chat models
    try {
      const form0 = new FormData();
      form0.set('key', 'enabledChatModelIds');
      form0.set('value', JSON.stringify(validEnabled, null, 2));
      const res0 = await fetch('/admin/api/settings', { method: 'POST', body: form0 });
      if (!res0.ok) throw new Error('enabled chat models');
    } catch {
      setBanner('Failed to save enabled chat models');
      setTimeout(() => setBanner(null), 2500);
      return;
    }

    // Save default chat model id
    try {
      const formD = new FormData();
      formD.set('key', 'defaultChatModelId');
      formD.set('value', finalDefault);
      const resD = await fetch('/admin/api/settings', { method: 'POST', body: formD });
      if (!resD.ok) throw new Error('default model');
    } catch {
      setBanner('Failed to save default chat model');
      setTimeout(() => setBanner(null), 2500);
      return;
    }
    // Save OpenRouter overrides
    const form = new FormData();
    form.set('key', 'modelOverridesOpenRouter');
    form.set('value', JSON.stringify(overridesOR, null, 2));
    const res = await fetch('/admin/api/settings', { method: 'POST', body: form });
    if (!res.ok) {
      setBanner('Failed to save OpenRouter mappings');
      setTimeout(() => setBanner(null), 2500);
      return;
    }

    // Save Groq overrides
    const form2 = new FormData();
    form2.set('key', 'modelOverridesGroq');
    form2.set('value', JSON.stringify(overridesGroq, null, 2));
    const res2 = await fetch('/admin/api/settings', { method: 'POST', body: form2 });
    if (!res2.ok) {
      setBanner('Failed to save Groq mappings');
      setTimeout(() => setBanner(null), 2500);
      return;
    }

    // Save default provider preference
    const form3 = new FormData();
    form3.set('key', 'defaultProviderPreference');
    form3.set('value', providerPref);
    const res3 = await fetch('/admin/api/settings', { method: 'POST', body: form3 });
    if (!res3.ok) {
      setBanner('Failed to save provider preference');
      setTimeout(() => setBanner(null), 2500);
      return;
    }

    setBanner('Saved');
    setTimeout(() => setBanner(null), 2000);
  }

  return (
    <div>
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <span>Model Management</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { refreshModels(); refreshGroq(); }}>
              Refresh Lists
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={() => setConfirmOpen(true)}>Save</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Save model settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will update provider preference and model mappings for your deployment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setConfirmOpen(false);
                      await handleSave();
                    }}
                  >
                    Save
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {banner && (
          <div className="mt-2 text-sm px-2 py-1 rounded border bg-muted/30 inline-block">
            {banner}
          </div>
        )}
      </div>
      <div className="space-y-5">
        {/* Chat Models Availability */}
        <div className="rounded border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Chat Models Availability</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnabledChatModelIds(defaultChatModels.map((m) => m.id))}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnabledChatModelIds([])}
              >
                Disable All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="default-chat-model" className="text-xs">Default Chat Model</Label>
              <Select value={defaultChatModelId} onValueChange={(v) => setDefaultChatModelId(v)}>
                <SelectTrigger id="default-chat-model" className="w-full mt-1">
                  <SelectValue placeholder="Select default model" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {defaultChatModels
                    .filter((m) => enabledChatModelIds.includes(m.id))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {defaultChatModels.map((m) => {
              const checked = enabledChatModelIds.includes(m.id);
              return (
                <div key={m.id} className="rounded-md border p-3 flex items-start gap-3">
                  <Switch
                    id={`enable-${m.id}`}
                    checked={checked}
                    onCheckedChange={(val) => {
                      setEnabledChatModelIds((prev) =>
                        val ? Array.from(new Set([...prev, m.id])) : prev.filter((id) => id !== m.id),
                      );
                      if (!val && defaultChatModelId === m.id) {
                        const next = defaultChatModels.find((x) => x.id !== m.id && enabledChatModelIds.includes(x.id))?.id || '';
                        setDefaultChatModelId(next);
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded border p-3 space-y-3">
          <div className="font-semibold font-serif text-lg">Default Provider Preference</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'balance', label: 'Load Balance', Icon: HomeIcon },
              { id: 'groq', label: 'Groq Only', Icon: BoxIcon },
              { id: 'openrouter', label: 'OpenRouter Only', Icon: GPSIcon },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-active={providerPref === (opt.id as any)}
                onClick={() => setProviderPref(opt.id as any)}
                className="rounded-md border p-3 text-left flex items-start gap-3 transition-colors hover:border-foreground/30 hover:bg-accent/40 data-[active=true]:border-foreground data-[active=true]:bg-accent/60"
                aria-pressed={providerPref === (opt.id as any)}
              >
                <div className="mt-0.5 text-foreground">
                  <opt.Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {opt.id === 'balance' && 'Use both providers, balanced.'}
                    {opt.id === 'groq' && 'Use Groq when available.'}
                    {opt.id === 'openrouter' && 'Use OpenRouter when available.'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold font-serif text-lg">OpenRouter Mappings</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverridesOR(DEFAULT_MODEL_MAP)}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
          {loadingModels && (
            <div className="text-sm text-muted-foreground">Loading models…</div>
          )}
          {!loadingModels && models.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No models found or OpenRouter key missing.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {managedIds.map((id) => {
              const currentValue =
                overridesOR[id] && modelOptions.some((o) => o.value === overridesOR[id])
                  ? overridesOR[id]
                  : modelOptions.some((o) => o.value === DEFAULT_MODEL_MAP[id])
                    ? DEFAULT_MODEL_MAP[id]
                    : '';
              const Icon =
                id === 'chat-model-small'
                  ? BotIcon
                  : id === 'chat-model-large'
                    ? BoxIcon
                    : id === 'chat-model-reasoning'
                      ? InfoIcon
                      : id === 'title-model'
                        ? FileIcon
                        : id === 'artifact-model'
                          ? BoxIcon
                          : BotIcon;
              return (
                <div key={id} className="rounded-md border p-3 flex gap-3 items-start">
                  <div className="mt-0.5 text-foreground">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{friendlyName(id, defaultChatModels)}</div>
                    <div className="mt-2">
                      <Label className="sr-only" htmlFor={`or-${id}`}>
                        {friendlyName(id)} (OpenRouter)
                      </Label>
                      <Select
                        value={currentValue}
                        onValueChange={(v) => setOverridesOR((prev) => ({ ...prev, [id]: v }))}
                      >
                        <SelectTrigger id={`or-${id}`} className="w-full">
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold font-serif text-lg">Groq Mappings</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverridesGroq({})}
              >
                Clear All
              </Button>
            </div>
          </div>
          {loadingGroq && (
            <div className="text-sm text-muted-foreground">Loading models…</div>
          )}
          {!loadingGroq && groqModels.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No models found or Groq key missing.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {managedIds.map((id) => {
              const Icon =
                id === 'chat-model-small'
                  ? BotIcon
                  : id === 'chat-model-large'
                    ? BoxIcon
                    : id === 'chat-model-reasoning'
                      ? InfoIcon
                      : id === 'title-model'
                        ? FileIcon
                        : id === 'artifact-model'
                          ? BoxIcon
                          : BotIcon;
              return (
                <div key={id} className="rounded-md border p-3 flex gap-3 items-start">
                  <div className="mt-0.5 text-foreground">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{friendlyName(id, defaultChatModels)}</div>
                    <div className="mt-2">
                      <Label className="sr-only" htmlFor={`groq-${id}`}>
                        {friendlyName(id)} (Groq)
                      </Label>
                      <Select
                        value={overridesGroq[id] || ''}
                        onValueChange={(v) => setOverridesGroq((prev) => ({ ...prev, [id]: v }))}
                      >
                        <SelectTrigger id={`groq-${id}`} className="w-full">
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
