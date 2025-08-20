import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  openGraph: {
    images: [{ url: '/og?title=Profile&subtitle=Account%20details%20and%20profile&emoji=%F0%9F%91%A4&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Profile&subtitle=Account%20details%20and%20profile&emoji=%F0%9F%91%A4&theme=brand' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
