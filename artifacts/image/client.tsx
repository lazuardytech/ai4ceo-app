import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'data-imageDelta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ImageEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy image to clipboard',
      onClick: async ({ content }) => {
        const src =
          typeof content === 'string'
            ? content.startsWith('data:image/') || /^https?:\/\//.test(content)
              ? content
              : `data:image/png;base64,${content}`
            : '';

        const copyBlob = async (blob: Blob) => {
          if (
            blob &&
            navigator.clipboard &&
            'write' in navigator.clipboard &&
            typeof ClipboardItem !== 'undefined'
          ) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            toast.success('Copied image to clipboard!');
          } else {
            // Fallback: copy as data URL text
            const dataUrl = await new Promise<string>((resolve) => {
              const fr = new FileReader();
              fr.onload = () => resolve(String(fr.result));
              fr.readAsDataURL(blob);
            });
            await navigator.clipboard.writeText(dataUrl);
            toast.success('Copied image data URL to clipboard!');
          }
        };

        const drawAndCopy = async (img: HTMLImageElement | ImageBitmap) => {
          const canvas = document.createElement('canvas');
          const w =
            'width' in img ? (img as any).width : (img as ImageBitmap).width;
          const h =
            'height' in img ? (img as any).height : (img as ImageBitmap).height;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Canvas not supported');
            return;
          }
          if ('close' in img) {
            ctx.drawImage(img as ImageBitmap, 0, 0);
          } else {
            ctx.drawImage(img as HTMLImageElement, 0, 0);
          }
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                await copyBlob(blob);
              } else {
                toast.error('Failed to create PNG blob');
              }
            },
            'image/png',
            1.0,
          );
        };

        try {
          if (/^https?:\/\//.test(src)) {
            // Use fetch to avoid tainted canvas on cross-origin sources
            const res = await fetch(src, { mode: 'cors' });
            const blob = await res.blob();

            if ('createImageBitmap' in window) {
              const bmp = await createImageBitmap(blob);
              await drawAndCopy(bmp);
            } else {
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = url;
              img.onload = async () => {
                URL.revokeObjectURL(url);
                await drawAndCopy(img);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                toast.error('Failed to load image');
              };
            }
          } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = async () => {
              await drawAndCopy(img);
            };
            img.onerror = () => {
              toast.error('Failed to load image');
            };
          }
        } catch {
          toast.error('Copy failed');
        }
      },
    },
  ],
  toolbar: [],
});
