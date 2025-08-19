'use client';

import { JSX, useMemo, useState } from 'react';
import type { Agent } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from '@/components/toast';
import {
  BotIcon,
  BoxIcon,
  FileIcon,
  InfoIcon,
  HomeIcon,
  GPSIcon,
  PencilEditIcon,
} from '@/components/icons';

type IconKey = 'bot' | 'box' | 'file' | 'info' | 'home' | 'gps' | 'pencil';
const IconMap: Record<IconKey, JSX.Element> = {
  bot: <BotIcon />,
  box: <BoxIcon size={16} />,
  file: <FileIcon />,
  info: <InfoIcon />,
  home: <HomeIcon size={16} />,
  gps: <GPSIcon size={16} />,
  pencil: <PencilEditIcon />,
};

function IconSelector({ value, onChange }: { value: IconKey; onChange: (v: IconKey) => void }) {
  const options: IconKey[] = ['bot', 'box', 'file', 'info', 'home', 'gps', 'pencil'];
  return (
    <div className="grid grid-cols-7 gap-2">
      {options.map((k) => (
        <button
          key={k}
          type="button"
          data-active={value === k}
          onClick={() => onChange(k)}
          className="rounded-md border p-2 flex items-center justify-center hover:bg-accent/40 hover:border-foreground/40 data-[active=true]:bg-accent/60 data-[active=true]:border-foreground"
          aria-pressed={value === k}
          title={k}
        >
          {IconMap[k]}
        </button>
      ))}
    </div>
  );
}

export function ExpertsPanel({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return agents.filter((a) => {
      const matchesText = !t || [a.name, a.slug, a.description || ''].some((s) => s.toLowerCase().includes(t));
      const matchesStatus =
        status === 'all' ? true : status === 'active' ? a.isActive : !a.isActive;
      return matchesText && matchesStatus;
    });
  }, [agents, q, status]);

  function StatusChips({ a }: { a: Agent }) {
    return (
      <div className="flex gap-2">
        <Badge variant={a.isActive ? 'default' : 'secondary'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
        <Badge variant={a.ragEnabled ? 'outline' : 'secondary'}>{a.ragEnabled ? 'RAG' : 'No RAG'}</Badge>
      </div>
    );
  }

  function AgentIcon({ a }: { a: Agent }) {
    const k = (a.icon as IconKey) || 'bot';
    return <div className="text-foreground">{IconMap[k] || <BotIcon />}</div>;
  }

  function EditModal({ a }: { a: Agent }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(a.name);
    const [description, setDescription] = useState(a.description || '');
    const [prePrompt, setPrePrompt] = useState(a.prePrompt);
    const [personality, setPersonality] = useState(a.personality);
    const [isActive, setIsActive] = useState(a.isActive);
    const [ragEnabled, setRagEnabled] = useState(a.ragEnabled);
    const [icon, setIcon] = useState<IconKey>((a.icon as IconKey) || 'bot');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onSave = async () => {
      const errs: Record<string, string> = {};
      if (!name.trim()) errs.name = 'Name is required';
      if (!prePrompt.trim()) errs.prePrompt = 'Pre-prompt is required';
      if (!personality.trim()) errs.personality = 'Personality is required';
      setErrors(errs);
      if (Object.keys(errs).length) return;
      const res = await fetch(`/admin/api/agents/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, prePrompt, personality, isActive, ragEnabled, icon }),
      });
      if (!res.ok) {
        toast({ type: 'error', description: 'Failed to update expert' });
        return;
      }
      const updated = (await res.json()) as Agent;
      setAgents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast({ type: 'success', description: 'Expert updated' });
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Edit</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Expert</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor={`name-${a.id}`}>Name</Label>
                <Input id={`name-${a.id}`} value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`desc-${a.id}`}>Description</Label>
                <Input id={`desc-${a.id}`} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Pre-prompt</Label>
                <Textarea className="font-mono h-28" value={prePrompt} onChange={(e) => setPrePrompt(e.target.value)} />
                {errors.prePrompt && <div className="text-xs text-red-600">{errors.prePrompt}</div>}
              </div>
              <div className="grid gap-1">
                <Label>Personality</Label>
                <Textarea className="font-mono h-28" value={personality} onChange={(e) => setPersonality(e.target.value)} />
                {errors.personality && <div className="text-xs text-red-600">{errors.personality}</div>}
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Icon</Label>
              <IconSelector value={icon} onChange={setIcon} />
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={isActive} onCheckedChange={setIsActive} /> Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={ragEnabled} onCheckedChange={setRagEnabled} /> RAG Enabled
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function CreateModal() {
    const [open, setOpen] = useState(false);
    const [slug, setSlug] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [prePrompt, setPrePrompt] = useState('');
    const [personality, setPersonality] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [ragEnabled, setRagEnabled] = useState(true);
    const [icon, setIcon] = useState<IconKey>('bot');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onCreate = async () => {
      const errs: Record<string, string> = {};
      if (!slug.trim()) errs.slug = 'Slug is required';
      if (!name.trim()) errs.name = 'Name is required';
      if (!prePrompt.trim()) errs.prePrompt = 'Pre-prompt is required';
      if (!personality.trim()) errs.personality = 'Personality is required';
      setErrors(errs);
      if (Object.keys(errs).length) return;
      const res = await fetch('/admin/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, description, prePrompt, personality, isActive, ragEnabled, icon }),
      });
      if (!res.ok) {
        toast({ type: 'error', description: 'Failed to create expert' });
        return;
      }
      const created = (await res.json()) as Agent;
      setAgents((prev) => [created, ...prev]);
      toast({ type: 'success', description: 'Expert created' });
      setOpen(false);
      setSlug('');
      setName('');
      setDescription('');
      setPrePrompt('');
      setPersonality('');
      setIsActive(true);
      setRagEnabled(true);
      setIcon('bot');
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>New Expert</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Expert</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., tech" />
                {errors.slug && <div className="text-xs text-red-600">{errors.slug}</div>}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Pre-prompt</Label>
                <Textarea className="font-mono h-28" value={prePrompt} onChange={(e) => setPrePrompt(e.target.value)} />
                {errors.prePrompt && <div className="text-xs text-red-600">{errors.prePrompt}</div>}
              </div>
              <div className="grid gap-1">
                <Label>Personality</Label>
                <Textarea className="font-mono h-28" value={personality} onChange={(e) => setPersonality(e.target.value)} />
                {errors.personality && <div className="text-xs text-red-600">{errors.personality}</div>}
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Icon</Label>
              <IconSelector value={icon} onChange={setIcon} />
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={isActive} onCheckedChange={setIsActive} /> Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={ragEnabled} onCheckedChange={setRagEnabled} /> RAG Enabled
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search experts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <div className="flex gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
              ] as const
            ).map((f) => (
              <Button
                key={f.id}
                variant={status === f.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
        <CreateModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((a) => (
          <div key={a.id} className="p-4 border rounded-md shadow-sm hover:shadow transition-colors hover:border-foreground/30">
            <div className="pb-2 flex flex-row items-center justify-between">
              <span className="text-base flex items-center gap-2">
                <AgentIcon a={a} />
                <span className='font-medium'>
                  {a.name} <span className="text-muted-foreground font-normal">({a.slug})</span>
                </span>
              </span>
              <StatusChips a={a} />
            </div>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground truncate">{a.description}</div>
              <div className="flex gap-2 items-center">
                <EditModal a={a} />
                <Button asChild variant="outline" size="sm">
                  <a href={`/admin/experts/${a.id}`}>Knowledge</a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 px-2">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete expert?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const res = await fetch(`/admin/api/agents/${a.id}`, { method: 'DELETE' });
                          if (!res.ok) {
                            toast({ type: 'error', description: 'Failed to delete expert' });
                            return;
                          }
                          setAgents((prev) => prev.filter((x) => x.id !== a.id));
                          toast({ type: 'success', description: 'Expert deleted' });
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpertsPanel;
