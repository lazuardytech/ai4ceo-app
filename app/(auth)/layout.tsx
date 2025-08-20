import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth',
  openGraph: {
    images: [{ url: '/og?title=Auth&subtitle=Sign%20in%20or%20create%20account&emoji=%F0%9F%94%90&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Auth&subtitle=Sign%20in%20or%20create%20account&emoji=%F0%9F%94%90&theme=brand' }],
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
