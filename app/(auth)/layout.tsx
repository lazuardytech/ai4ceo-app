import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Auth' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Auth' }],
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}

