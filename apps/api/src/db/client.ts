import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbOrTx = Database | Transaction;

export function createDatabase(url: string): { db: Database; close: () => Promise<void> } {
  const client = postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,
  });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  return { db, close: () => client.end({ timeout: 5 }) };
}
