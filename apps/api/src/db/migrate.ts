import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDatabase } from './client.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const { db, close } = createDatabase(url);
try {
  await migrate(db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname });
  console.warn('migrations applied');
} finally {
  await close();
}
