import 'dotenv/config';
import { fetchAndCurateOnce } from '@/lib/news/curator';
import { createScriptDbConnection } from '@/lib/db/utils';
import { drizzle } from 'drizzle-orm/postgres-js';

// Ensure DB can initialize in script context
(async () => {
  try {
    // Touch connection to ensure env is valid
    createScriptDbConnection();
    const res = await fetchAndCurateOnce();
    // eslint-disable-next-line no-console
    console.log('Curated news run complete:', res);
    process.exit(0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Curated news run failed:', e);
    process.exit(1);
  }
})();

