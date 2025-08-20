import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Files',
  openGraph: {
    images: [{ url: '/og?title=Files&subtitle=Manage%20your%20uploads&emoji=%F0%9F%97%82%EF%B8%8F&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Files&subtitle=Manage%20your%20uploads&emoji=%F0%9F%97%82%EF%B8%8F&theme=brand' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
