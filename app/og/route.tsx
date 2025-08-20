import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const size = { width: 1200, height: 630 } as const;

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function themeColors(variant?: string) {
  switch ((variant || 'brand').toLowerCase()) {
    case 'black':
      return {
        bg: '#000000',
        accentFrom: '#D84040',
        accentTo: '#D84040',
        text: '#f5f5f5',
        title: '#ffffff',
        muted: '#cbd5e1',
      } as const;
    case 'white':
      return {
        bg: '#ffffff',
        accentFrom: '#D84040',
        accentTo: '#D84040',
        text: '#0a0a0a',
        title: '#000000',
        muted: '#475569',
      } as const;
    case 'brand':
    default:
      return {
        bg: '#ffffff',
        accentFrom: '#D84040',
        accentTo: '#D84040',
        text: '#0a0a0a',
        title: '#000000',
        muted: '#475569',
      } as const;
  }
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const title = clamp(searchParams.get('title') || 'AI4CEO Companion', 90);
  const subtitle = clamp(
    searchParams.get('subtitle') || 'Intelligent tools for modern operators',
    140,
  );
  const emoji = searchParams.get('emoji') || '';
  const variant = (searchParams.get('theme') || 'brand').toLowerCase();
  const colors = themeColors(variant);
  const logoUrl = `${origin}/images/logo.svg`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          background: colors.bg,
          color: colors.text,
          padding: 64,
          boxSizing: 'border-box',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            width={250}
            height={50}
            alt="AI4CEO"
            style={{ borderRadius: 12 }}
          />
          {/*<div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: colors.title }}>
            AI4CEO
          </div>*/}
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {emoji ? <div style={{ fontSize: 64, lineHeight: 1 }}>{emoji}</div> : null}
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: -1.4,
                color: colors.title,
                lineHeight: 1.05,
                display: 'block',
              }}
            >
              {title}
            </div>
          </div>
          {subtitle ? (
            <div style={{ fontSize: 30, color: colors.muted, lineHeight: 1.3 }}>{subtitle}</div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, color: colors.text, opacity: 0.9 }}>{new URL(origin).host}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: colors.accentFrom, fontSize: 22 }}>
            <span>Share • Discover • Build</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
