import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Failed',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Payment%20Failed' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Payment%20Failed' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

