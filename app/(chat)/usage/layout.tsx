import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Usage' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Usage' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

