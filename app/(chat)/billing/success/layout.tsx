import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Successful',
  openGraph: {
    images: [{ url: '/opengraph-image?title=Payment%20Successful' }],
  },
  twitter: {
    images: [{ url: '/opengraph-image?title=Payment%20Successful' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

