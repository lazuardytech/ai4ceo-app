"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IconInfoCircle, IconInfoSquare } from '@tabler/icons-react';
import Image from 'next/image';

export const Greeting = ({ name }: { name: string }) => {
  const [subtitle, setSubtitle] = useState<string>('What\'s up?');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/greeting', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { subtitle?: string };
        if (!cancelled && data?.subtitle) setSubtitle(data.subtitle);
      } catch {
        // ignore & keep default subtitle
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold font-serif text-center mx-auto"
      >
        {/*{`Hello, ${name}!`}*/}
        <Image src="/images/logo.svg" width={150} height={75} alt="Logo" />

      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-xl text-zinc-500 mx-auto mt-10"
      >
        {`Hi, ${name}!`} {' '}
        {subtitle}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="text-2xl text-zinc-500 mt-8"
      >
        <p className="leading-relaxed text-sm text-center max-w-md mx-auto">
          Ask me anything! I&apos;m here to help you as a personal business consultant.
          <span className="font-semibold font-serif"> Advanced </span>
          model can generate documents directly in chat, while
          <span className="font-semibold font-serif"> Thinker </span>
          model can research a more deep and complex topics.
        </p>
      </motion.div>
    </div>
  );
};
