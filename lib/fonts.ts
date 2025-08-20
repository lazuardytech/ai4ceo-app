import localFont from 'next/font/local';
import { Instrument_Serif, Geist_Mono } from 'next/font/google';

export const haskoy = localFont({
  src: '../assets/fonts/haskoy-variable.woff2',
  variable: '--font-haskoy',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  preload: true,
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-serif',
  weight: '400',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});
