import { LoaderIcon } from './icons';
import cn from 'classnames';

interface ImageEditorProps {
  title: string;
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
}

export function ImageEditor({
  title,
  content,
  status,
  isInline,
}: ImageEditorProps) {
  const normalizedSrc =
    typeof content === 'string' && content.startsWith('data:image/')
      ? content
      : `data:image/png;base64,${(content || '')
        .replace(/^data:image\/\w+;base64,/, '')
        .replace(/\s+/g, '')}`;
  return (
    <div
      className={cn('flex flex-row items-center justify-center w-full', {
        'h-[calc(100dvh-60px)]': !isInline,
        'h-[200px]': isInline,
      })}
    >
      {status === 'streaming' ? (
        <div className="flex flex-row gap-4 items-center">
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div>Generating Image...</div>
        </div>
      ) : (
        <picture>
          <img
            className={cn('w-full h-fit max-w-[800px]', {
              'p-0 md:p-20': !isInline,
            })}
            src={normalizedSrc}
            alt={title}
          />
        </picture>
      )}
    </div>
  );
}
