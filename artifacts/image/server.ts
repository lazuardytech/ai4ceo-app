import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';

// Normalize base64 content by stripping data URL prefix and whitespace.
function normalizeBase64(input: string): string {
  if (!input) return '';
  // Remove data URL prefix if present and any whitespace/newlines
  const cleaned = input.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
  return cleaned;
}

// A 1x1 transparent PNG (base64, no data URL prefix)
const TRANSPARENT_PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    try {
      const { image } = await experimental_generateImage({
        model: myProvider.imageModel('small-model'),
        prompt: title,
        n: 1,
      });

      const normalized = normalizeBase64((image as any)?.base64 ?? (image as any)?.b64 ?? '');
      draftContent = normalized;

      dataStream.write({
        type: 'data-imageDelta',
        data: normalized,
        transient: true,
      });
    } catch {
      const fallback = TRANSPARENT_PNG_1X1_BASE64;
      draftContent = fallback;
      dataStream.write({
        type: 'data-imageDelta',
        data: fallback,
        transient: true,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';

    try {
      const { image } = await experimental_generateImage({
        model: myProvider.imageModel('small-model'),
        prompt: description,
        n: 1,
      });

      const normalized = normalizeBase64((image as any)?.base64 ?? (image as any)?.b64 ?? '');
      draftContent = normalized;

      dataStream.write({
        type: 'data-imageDelta',
        data: normalized,
        transient: true,
      });
    } catch {
      const fallback = TRANSPARENT_PNG_1X1_BASE64;
      draftContent = fallback;
      dataStream.write({
        type: 'data-imageDelta',
        data: fallback,
        transient: true,
      });
    }

    return draftContent;
  },
});
