import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage',
  openGraph: {
    images: [{ url: '/og?title=Usage&subtitle=Monthly%20usage%20and%20limits&emoji=%F0%9F%93%88&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Usage&subtitle=Monthly%20usage%20and%20limits&emoji=%F0%9F%93%88&theme=brand' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
