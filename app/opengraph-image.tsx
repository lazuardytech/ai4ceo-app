import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OGImage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const rawTitle = searchParams?.title;
  const title = Array.isArray(rawTitle)
    ? rawTitle[0]
    : (rawTitle || 'AI4CEO Companion');

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
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 30%, #111827 70%, #0b1022 100%)',
          color: '#e5e7eb',
          padding: 64,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
              boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>AI4CEO</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: '#f8fafc',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: '#9ca3af' }}>
            Intelligent tools for modern operators
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, color: '#cbd5e1' }}>app.ai4.ceo</div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              color: '#a5b4fc',
              fontSize: 22,
            }}
          >
            <span>Share • Discover • Build</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

