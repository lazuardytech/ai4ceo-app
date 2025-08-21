import localFont from 'next/font/local';
import { Bentham, Geist_Mono } from 'next/font/google';

export const haskoy = localFont({
  src: '../assets/fonts/haskoy-variable.woff2',
  variable: '--font-haskoy',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  preload: true,
});

export const gambarino = localFont({
  src: '../assets/fonts/gambarino-regular.woff2',
  variable: '--font-serif',
  display: 'swap',
  weight: '400',
  style: 'normal',
  preload: true,
});

export const bentham = Bentham({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: '400',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});
