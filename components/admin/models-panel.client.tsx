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
import { BotIcon, BoxIcon, FileIcon, InfoIcon } from '@/components/icons';

// type OpenRouterModel = { id: string; name: string; description?: string }; // Disabled for Groq-only
type GroqModel = { id: string; name: string };

const managedIds = [
  'chat-model',
  'chat-model-small',
  'chat-model-large',
  'chat-model-reasoning',
  'title-model',
  'artifact-model',
];

// Default Groq model IDs (OpenRouter defaults commented out for reference)
const DEFAULT_GROQ_MODEL_MAP: Record<string, string> = {
  'chat-model': 'llama3-8b-8192',
  'chat-model-small': 'llama3-8b-8192',
  'chat-model-large': 'llama3-70b-8192',
  'chat-model-reasoning': 'llama3-70b-8192',
  'title-model': 'llama3-8b-8192',
  'artifact-model': 'llama3-8b-8192',
};

// Commented out for reference (OpenRouter defaults):
// const DEFAULT_OPENROUTER_MODEL_MAP: Record<string, string> = {
//   'chat-model': 'moonshotai/kimi-k2:free',
//   'chat-model-small': 'moonshotai/kimi-k2:free',
//   'chat-model-large': 'moonshotai/kimi-k2:free',
//   'chat-model-reasoning': 'deepseek/deepseek-r1:free',
//   'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
//   'artifact-model': 'moonshotai/kimi-k2:free',
// };

function friendlyName(id: string, list?: ChatModel[]) {
  const fromList = (list || defaultChatModels).find((m) => m.id === id);
  if (fromList) return fromList.name;
  if (id === 'title-model') return 'Title Model';
  if (id === 'artifact-model') return 'Artifact Model';
  if (id === 'chat-model') return 'Default Chat Model';
  return id;
}

export default function AdminModelsPanel() {
  // Disabled OpenRouter API calls for Groq-only setup
  // const { data: openRouterList, isLoading: loadingModels, mutate: refreshModels } =
  //   useSWR<{ models: OpenRouterModel[] }>(
  //     '/admin/api/models/openrouter',
  //     fetcher,
  //   );

  const { data: groqList, isLoading: loadingGroq, mutate: refreshGroq } =
    useSWR<{ models: GroqModel[] }>(
      '/admin/api/models/groq',
      fetcher,
    );
  const { data: settings } = useSWR<Record<string, any>>(
    '/admin/api/settings',
    fetcher,
  );

  // const [overridesOR, setOverridesOR] = useState<Record<string, string>>({}); // Disabled
  const [overridesGroq, setOverridesGroq] = useState<Record<string, string>>({});
  const [providerPref, setProviderPref] = useState<'balance' | 'groq' | 'openrouter'>(
    'groq', // Default to Groq
  );

  // const models = useMemo(
  //   () => openRouterList?.models ?? ([] as OpenRouterModel[]),
  //   [openRouterList?.models],
  // ); // Disabled

  const groqModels = useMemo(
    () => groqList?.models ?? ([] as GroqModel[]),
    [groqList?.models],
  );

  // const orFromSettings = useMemo(
  //   () =>
  //     (settings?.modelOverridesOpenRouter as Record<string, string> | undefined) ??
  //     (settings?.modelOverrides as Record<string, string> | undefined) ??
  //     undefined,
  //   [settings?.modelOverridesOpenRouter, settings?.modelOverrides],
  // ); // Disabled

  const groqFromSettings = useMemo(
    () => (settings?.modelOverridesGroq as Record<string, string> | undefined) ?? undefined,
    [settings?.modelOverridesGroq],
  );
  const prefFromSettings = useMemo(
    () => (settings?.defaultProviderPreference as any) ?? 'groq',
    [settings?.defaultProviderPreference],
  );

  useEffect(() => {
    // if (orFromSettings) setOverridesOR(orFromSettings);
    // else if (Object.keys(overridesOR).length === 0) setOverridesOR(DEFAULT_OPENROUTER_MODEL_MAP); // Disabled

    if (groqFromSettings) setOverridesGroq(groqFromSettings);
    else if (Object.keys(overridesGroq).length === 0)
      setOverridesGroq(DEFAULT_GROQ_MODEL_MAP);

    setProviderPref(prefFromSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groqFromSettings, prefFromSettings]);

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

  // const modelOptions = useMemo(
  //   () => models.map((m) => ({ value: m.id, label: m.name || m.id })),
  //   [models],
  // ); // Disabled

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

    // OpenRouter overrides disabled - keeping for reference
    // const form = new FormData();
    // form.set('key', 'modelOverridesOpenRouter');
    // form.set('value', JSON.stringify(overridesOR, null, 2));
    // const res = await fetch('/admin/api/settings', { method: 'POST', body: form });
    // if (!res.ok) {
    //   setBanner('Failed to save OpenRouter mappings');
    //   setTimeout(() => setBanner(null), 2500);
    //   return;
    // }

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

    // Save default provider preference (though it's forced to Groq)
    const form3 = new FormData();
    form3.set('key', 'defaultProviderPreference');
    form3.set('value', 'groq'); // Force Groq
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
    <div className="max-w-4xl mx-auto">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Model Configuration</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure Groq models for AI chat functionality</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { refreshGroq(); }}>
              Refresh Models
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={() => setConfirmOpen(true)}>Save Changes</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Save model settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will update model mappings and preferences for your deployment.
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
          <div className="mt-3 text-sm px-3 py-2 rounded-md border bg-muted/30 inline-block">
            {banner}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Chat Models Availability */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Chat Models Availability</h3>
              <p className="text-sm text-muted-foreground">Enable/disable chat models for users</p>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-chat-model" className="text-sm font-medium">Default Chat Model</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultChatModels.map((m) => {
              const checked = enabledChatModelIds.includes(m.id);
              return (
                <div key={m.id} className="rounded-md border p-3 flex items-start gap-3 bg-background">
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

        {/* Provider Status - Informational only since we're Groq-only */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Provider Status</h3>
            <p className="text-sm text-muted-foreground">Currently configured to use Groq only</p>
          </div>
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Groq Active</span>
              <span className="text-xs text-muted-foreground ml-auto">Load balancing disabled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              OpenRouter provider is temporarily disabled. All requests will use Groq models.
            </p>
          </div>
        </div>

        {/* Groq Model Mappings */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Groq Model Mappings</h3>
              <p className="text-sm text-muted-foreground">Configure which Groq models to use for each function</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverridesGroq(DEFAULT_GROQ_MODEL_MAP)}
              >
                Reset to Defaults
              </Button>
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
            <div className="text-sm text-muted-foreground py-4 text-center">Loading models…</div>
          )}
          {!loadingGroq && groqModels.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-md">
              No models found. Please check your Groq API key configuration.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {managedIds.map((id) => {
              const currentValue = overridesGroq[id] || DEFAULT_GROQ_MODEL_MAP[id] || '';
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
                <div key={id} className="rounded-md border p-3 flex gap-3 items-start bg-background">
                  <div className="mt-1 text-foreground">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-2">{friendlyName(id, defaultChatModels)}</div>
                    <Label className="sr-only" htmlFor={`groq-${id}`}>
                      {friendlyName(id)} (Groq)
                    </Label>
                    <Select
                      value={currentValue}
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
              );
            })}
          </div>
        </div>

        {/* Hidden OpenRouter section - kept for reference if needed later */}
        {/*
        <div className="rounded-lg border bg-card p-4 space-y-4" style={{ display: 'none' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">OpenRouter Mappings (Disabled)</h3>
              <p className="text-sm text-muted-foreground">OpenRouter provider is currently disabled</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-md">
            OpenRouter integration is temporarily disabled. Contact administrator to re-enable.
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
