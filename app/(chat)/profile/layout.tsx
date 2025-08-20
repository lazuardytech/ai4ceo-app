import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Profile' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Profile' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

