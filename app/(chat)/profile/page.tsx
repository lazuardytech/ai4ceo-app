'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import Image from 'next/image';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Avatar as UiAvatar,
  AvatarFallback as UiAvatarFallback,
  AvatarImage as UiAvatarImage,
} from '@/components/ui/avatar';

type Profile = {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
  bio?: string | null;
  timezone?: string | null;
  locale?: string | null;
  role?: 'user' | 'admin';
  botTraits?: string[];
  onboarded?: boolean;
};

export default function ProfilePage() {
  const { mutate } = useSWRConfig();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    return profile.name?.trim() || profile.email || 'User';
  }, [profile]);

  const avatarSrc = useMemo(() => {
    if (filePreview) return filePreview;
    if (imageUrl?.trim()) return imageUrl.trim();
    if (profile?.image?.trim()) return profile.image.trim();
    const seed = encodeURIComponent(profile?.email || profile?.id || 'user');
    return `https://avatar.vercel.sh/${seed}`;
  }, [filePreview, imageUrl, profile?.email, profile?.id, profile?.image]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to load profile');
      }
      setProfile(data as Profile);
      if (Array.isArray((data as any).botTraits)) setTraits((data as any).botTraits);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // Initialize form when opening
  useEffect(() => {
    if (!open || !profile) return;
    setName(profile.name || '');
    setBio(profile.bio || '');
    setTimezone(profile.timezone || '');
    setLocale(profile.locale || '');
    setImageUrl(profile.image || '');
    setFile(null);
    setTraits(profile.botTraits || []);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  }, [open, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileChange = (f: File | null) => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let updated: Profile | null = null;

      if (file) {
        // Use multipart/form-data when a file is present
        const form = new FormData();
        if (name.trim().length > 0) form.set('name', name.trim());
        else form.set('name', '');

        form.set('bio', bio || '');
        form.set('timezone', timezone || '');
        form.set('locale', locale || '');
        form.set('image', file, file.name);

        const res = await fetch('/api/profile', {
          method: 'PATCH',
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to update profile');
        updated = data?.profile as Profile;
      } else {
        // JSON update (supports imageUrl)
        const payload: Record<string, any> = {
          name: name || '',
          bio: bio || '',
          timezone: timezone || '',
          locale: locale || '',
        };
        // Allow empty string to clear custom avatar
        payload.imageUrl = imageUrl ?? '';
        payload.botTraits = traits;

        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to update profile');
        updated = data?.profile as Profile;
      }

      if (updated) {
        const merged = { ...(updated as any), botTraits: traits } as Profile;
        setProfile(merged);
        // Update global cache so greeting and other components reflect changes immediately
        mutate('/api/profile', merged, { revalidate: false });
        toast.success('Profile updated');
      } else {
        toast.success('Saved');
      }

      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {/*<div className="space-y-2">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and update your account details. Changes are saved per user.
        </p>
      </div>*/}

      <div className="rounded-xl border">
        <div className="p-3 sm:p-4 flex flex-col gap-4">
          {/* Header: Avatar + Identity */}
          <div className="flex items-start gap-4">
            <div className="relative size-20">
              {/* Prefer Next/Image for optimization if URL is remote */}
              <UiAvatar className="size-20">
                <UiAvatarImage asChild>
                  <Image
                    src={avatarSrc}
                    alt={displayName || 'User avatar'}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    unoptimized={avatarSrc.startsWith('blob:')}
                  />
                </UiAvatarImage>
                <UiAvatarFallback className="text-sm">
                  {(displayName || 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
                </UiAvatarFallback>
              </UiAvatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-medium truncate">{displayName}</div>
                  {profile?.email && (
                    <div className="text-sm text-muted-foreground truncate">{profile.email}</div>
                  )}
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-8 px-3">Edit profile</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                      <DialogDescription>
                        Update your profile details. Avatar can be uploaded or linked via URL.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your display name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="A short description about you"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Input
                            id="timezone"
                            placeholder="e.g. America/Los_Angeles"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="locale">Locale</Label>
                          <Input
                            id="locale"
                            placeholder="e.g. en-US"
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Avatar</Label>
                        <div className="flex items-center gap-3">
                          <div className="relative size-16 shrink-0">
                            <UiAvatar className="size-16">
                              <UiAvatarImage asChild>
                                <Image
                                  src={avatarSrc}
                                  alt="Avatar preview"
                                  width={64}
                                  height={64}
                                  className="rounded-full object-cover"
                                  unoptimized={avatarSrc.startsWith('blob:')}
                                />
                              </UiAvatarImage>
                              <UiAvatarFallback>AV</UiAvatarFallback>
                            </UiAvatar>
                          </div>
                          <div className="flex-1 grid gap-2">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                handleFileChange(f);
                              }}
                            />
                            <Input
                              placeholder="Or paste image URL (used if no file selected)"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              disabled={!!file}
                            />
                            <div className="text-xs text-muted-foreground">
                              Tip: If you select a file, it will be uploaded and used as your avatar.
                              If no file is selected, the image URL will be saved instead.
                            </div>
                          </div>
                          {file && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => handleFileChange(null)}
                            >
                              Remove file
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={saving}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="button" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                {profile?.bio && (
                  <div className="text-foreground/90 whitespace-pre-wrap">{profile.bio}</div>
                )}
                <div className="text-muted-foreground grid gap-1 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground/80">Timezone:</span>{' '}
                    {profile?.timezone || '—'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Locale:</span>{' '}
                    {profile?.locale || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!profile?.bio && (
            <div className="rounded-md border p-3 text-xs text-muted-foreground bg-muted/40">
              Add a short bio and avatar so others can recognize your account more easily.
            </div>
          )}
        </div>

        {loading && (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
              <div className="h-20 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 p-3 sm:p-4 rounded-xl border">
        <div className='flex flex-col'>
          <div className="font-medium">Preferred Bot Traits</div>
          <div className="text-xs text-muted-foreground">Pick the assistant traits you prefer. These influence tone and style.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'friendly', label: 'Friendly' },
            { id: 'concise', label: 'Concise' },
            { id: 'curious', label: 'Curious' },
            { id: 'empathetic', label: 'Empathetic' },
            { id: 'direct', label: 'Direct' },
            { id: 'supportive', label: 'Supportive' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`text-left rounded border p-3 hover:bg-accent ${traits.includes(t.id) ? 'border-primary' : 'border-muted'
                }`}
              onClick={() =>
                setTraits((prev) =>
                  prev.includes(t.id)
                    ? prev.filter((x) => x !== t.id)
                    : [...prev, t.id],
                )
              }
            >
              <div className="font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* App Tour controls */}
      <div className="rounded-xl border">
        <div className="p-3 sm:p-4 flex justify-between items-center">
          <div>
            <h2 className="font-medium">App Tour</h2>
            <p className="text-sm text-muted-foreground">Restart the guided tour if you want to see it again.</p>
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch('/api/tour', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tour: false }),
                });
                if (!res.ok) throw new Error('Failed to reset tour');
                toast.success('Tour reset. It will show on home.');
              } catch (e: any) {
                toast.error(e?.message || 'Failed to reset tour');
              }
            }}
          >
            Restart Tour
          </Button>
        </div>
      </div>
    </div>
  );
}
