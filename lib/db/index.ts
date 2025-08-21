import { createDbConnection } from './utils';
import '@/lib/env-config'

export const db = createDbConnection();
