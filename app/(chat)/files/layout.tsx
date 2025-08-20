import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Files',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Files' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Files' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

