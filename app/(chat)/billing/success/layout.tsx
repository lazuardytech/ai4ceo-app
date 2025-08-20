import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Successful',
  openGraph: {
    images: [{ url: '/og?title=Payment%20Successful&subtitle=Your%20subscription%20is%20active&emoji=%E2%9C%85&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Payment%20Successful&subtitle=Your%20subscription%20is%20active&emoji=%E2%9C%85&theme=brand' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
