'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  role?: 'user' | 'admin' | 'superadmin';
};

export default function ProfilePage() {
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
        setProfile(updated);
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
    <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and update your account details. Changes are saved per user.
        </p>
      </div>

      <div className="rounded-xl border">
        <div className="p-4 sm:p-6 flex flex-col gap-4">
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
    </div>
  );
}
