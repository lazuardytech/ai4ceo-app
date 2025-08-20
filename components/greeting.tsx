"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const Greeting = ({ name }: { name: string }) => {
  const [subtitle, setSubtitle] = useState<string>('How can I help you today?');

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
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold font-serif"
      >
        {`Hello, ${name}!`}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        {subtitle}
      </motion.div>
    </div>
  );
};
