/**
 * Creates or updates accounts with a password: operators, moderators, test users.
 *
 *   INKWELL_USERS='[{"email":"a@example.ch","password":"…","roles":["admin"]}]' \
 *     pnpm --filter @inkwell/api users:create
 *
 * Needs DATABASE_URL and the API's SESSION_SECRET (addresses are stored hashed
 * with it). New accounts still run through onboarding on first sign-in: age
 * check, pseudonym, recovery code. Passwords are never printed.
 */
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { emailSchema, localeSchema } from '@inkwell/shared';

import { createDatabase } from '../db/client.js';
import { users } from '../db/schema.js';
import { setPassword } from '../services/auth.js';
import { createUser, findUserByEmail } from '../services/users.js';

const inputSchema = z
  .array(
    z.object({
      email: emailSchema,
      password: z.string().min(8).max(128),
      roles: z.array(z.enum(['member', 'admin'])).default([]),
      locale: localeSchema.default('de'),
    }),
  )
  .min(1);

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.SESSION_SECRET;
if (!databaseUrl || !secret) throw new Error('DATABASE_URL and SESSION_SECRET are required');

const parsed = inputSchema.safeParse(JSON.parse(process.env.INKWELL_USERS ?? '[]'));
if (!parsed.success) {
  throw new Error(
    `INKWELL_USERS is invalid:\n  ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')}`,
  );
}

const { db, close } = createDatabase(databaseUrl);
try {
  for (const entry of parsed.data) {
    const existing = await findUserByEmail(db, secret, entry.email);
    const user =
      existing ?? (await createUser(db, secret, { email: entry.email, locale: entry.locale }));
    const roles = Array.from(new Set(['member', ...user.roles, ...entry.roles]));
    await db.update(users).set({ roles, updatedAt: new Date() }).where(eq(users.id, user.id));
    await setPassword(db, user.id, entry.password);
    console.warn(`${existing ? 'updated' : 'created'} ${entry.email} roles=${roles.join(',')}`);
  }
} finally {
  await close();
}
