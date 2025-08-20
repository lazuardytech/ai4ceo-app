'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type UserFile = {
  id: string;
  name: string;
  url: string;
  contentType: string | null;
  size: string | null;
  storagePath: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function FilesPage() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?limit=100&includeDeleted=${includeDeleted ? '1' : '0'}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to load files (${res.status})`);
      }
      const data = (await res.json()) as { files: UserFile[] };
      setFiles(data.files || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onDelete = useCallback(
    async (file: UserFile) => {
      if (file.isDeleted) return;
      const proceed = window.confirm(
        [
          'Delete this file?',
          '',
          'Note:',
          '- Deleting files here will remove them from the relevant threads, but not delete the threads.',
          '- This may lead to unexpected behavior if you delete a file that is still being used in a thread.',
          '',
          `File: ${file.name}`,
        ].join('\n'),
      );
      if (!proceed) return;

      try {
        setDeletingId(file.id);
        const res = await fetch('/api/files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: file.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Failed to delete file (${res.status})`);
        }
        // Optimistic update: mark as deleted locally
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, isDeleted: true } : f)),
        );
        const details: string[] = [];
        if (typeof data.messagesUpdated === 'number') {
          details.push(`References removed from ${data.messagesUpdated} message(s).`);
        }
        if (typeof data.storageDeleted === 'boolean') {
          details.push(
            data.storageDeleted ? 'Storage object deleted.' : 'Could not delete storage object.',
          );
        }
        toast.success(`Deleted "${file.name}". ${details.join(' ')}`.trim());
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete file');
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const humanSize = useCallback((size: string | null) => {
    if (!size) return '—';
    const n = Number(size);
    if (Number.isNaN(n) || n < 0) return size;
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }, []);

  const anyFiles = files.length > 0;

  const activeCount = useMemo(() => files.filter((f) => !f.isDeleted).length, [files]);
  const deletedCount = useMemo(() => files.filter((f) => f.isDeleted).length, [files]);

  return (
    <div className="mx-auto max-w-[800px] w-full space-y-3">
      <div className="space-y-2 max-w-3xl w-full mx-auto">
        {/*<h1 className="text-2xl font-semibold">Your files</h1>*/}
        <p className="text-sm text-muted-foreground">
          Manage your uploaded files and attachments.
          <br />
          Note that deleting files here will remove them from the relevant threads, but not delete
          the threads. This may lead to unexpected behavior if you delete a file that is still being
          used in a thread.
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              Include deleted
            </label>
            <div className="text-xs text-muted-foreground">
              Active: {activeCount} • Deleted: {deletedCount}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadFiles()}
              disabled={loading}
              className="h-8 px-3"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-medium">Files</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Loading files…
                    </td>
                  </tr>
                )}

                {!loading && !anyFiles && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No files yet. Upload attachments from the chat input to see them here.
                    </td>
                  </tr>
                )}

                {!loading &&
                  files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <a
                            className="text-primary hover:underline break-all"
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.name}
                          </a>
                          <div className="text-xs text-muted-foreground break-all">{file.url}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{file.contentType || '—'}</td>
                      <td className="px-4 py-3">{humanSize(file.size)}</td>
                      <td className="px-4 py-3">
                        {file.createdAt ? new Date(file.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {file.isDeleted ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs">
                            Deleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-xs">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => copyUrl(file.url)}
                          >
                            Copy URL
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-8 px-2"
                            onClick={() => onDelete(file)}
                            disabled={file.isDeleted || deletingId === file.id}
                            title={
                              file.isDeleted
                                ? 'Already deleted'
                                : 'Delete file and remove references from your messages'
                            }
                          >
                            {deletingId === file.id ? 'Deleting…' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: When you upload files from the chat input, they will appear here. Deleting a file will
          remove it from any messages that reference it, but the threads will remain.
        </div>
      </div>
    </div>

  );
}
