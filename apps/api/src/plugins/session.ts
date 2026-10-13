import { and, eq, gt, isNull } from 'drizzle-orm';
import fp from 'fastify-plugin';

import { sessions, users } from '../db/schema.js';
import { sha256 } from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';

import type { AuthenticatedUser } from '../types.js';

const LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

/**
 * Resolves `Authorization: Bearer <token>` to a user. Tokens are high-entropy
 * and looked up by SHA-256. Suspended accounts can read but not write
 * (`requireActiveUser`), accounts pending deletion can only revoke the deletion.
 */
export const sessionPlugin = fp(async (app) => {
  app.decorateRequest('auth', null);
  app.decorateRequest('deviceHash', null);

  app.decorateRequest('requireUser', function (this: { auth: AuthenticatedUser | null }) {
    if (!this.auth) throw new ApiError('UNAUTHENTICATED');
    return this.auth;
  });

  app.decorateRequest('requireActiveUser', function (this: { auth: AuthenticatedUser | null }) {
    if (!this.auth) throw new ApiError('UNAUTHENTICATED');
    const { user } = this.auth;
    if (user.deletedAt) throw new ApiError('ACCOUNT_PENDING_DELETION');
    if (user.suspendedPermanently) throw new ApiError('ACCOUNT_SUSPENDED', { permanent: true });
    if (user.suspendedUntil && user.suspendedUntil.getTime() > Date.now()) {
      throw new ApiError('ACCOUNT_SUSPENDED', { until: user.suspendedUntil.toISOString() });
    }
    return this.auth;
  });

  app.decorateRequest('requireAdmin', function (this: { auth: AuthenticatedUser | null }) {
    if (!this.auth) throw new ApiError('UNAUTHENTICATED');
    if (!this.auth.user.roles.includes('admin')) throw new ApiError('FORBIDDEN');
    return this.auth;
  });

  app.addHook('onRequest', async (request) => {
    const deviceHeader = request.headers['x-device-hash'];
    request.deviceHash =
      typeof deviceHeader === 'string' && deviceHeader.length > 0 ? deviceHeader : null;

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
    const token = header.slice('Bearer '.length).trim();
    if (!token) return;

    const tokenHash = sha256(token);
    const now = new Date();
    const [row] = await app.ctx.db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row) throw new ApiError('SESSION_EXPIRED');

    request.auth = { user: row.user, sessionId: row.session.id };

    if (now.getTime() - row.session.lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS) {
      await app.ctx.db
        .update(sessions)
        .set({ lastSeenAt: now })
        .where(eq(sessions.id, row.session.id));
    }
  });
});
