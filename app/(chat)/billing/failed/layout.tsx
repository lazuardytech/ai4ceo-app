import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Failed',
  openGraph: {
    images: [{ url: '/og?title=Payment%20Failed&subtitle=Canceled%20or%20failed%20payment&emoji=%E2%9D%8C&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Payment%20Failed&subtitle=Canceled%20or%20failed%20payment&emoji=%E2%9D%8C&theme=brand' }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
