import { eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  appleSignInSchema,
  completeOnboardingSchema,
  isLocale,
  passkeyVerifySchema,
  pseudonymAvailabilitySchema,
  requestEmailCodeSchema,
  verifyEmailCodeSchema,
  type Locale,
} from '@inkwell/shared';

import { users } from '../db/schema.js';
import { describeDevice } from '../lib/device.js';
import { ApiError } from '../lib/errors.js';
import {
  consumeEmailCode,
  passkeyAuthenticationOptions,
  passkeyAuthenticationVerify,
  passkeyRegistrationOptions,
  passkeyRegistrationVerify,
  requestEmailCode,
  revokeSession,
  signInWithApple,
  signInWithEmailCode,
  type SessionResult,
} from '../services/auth.js';
import { changePseudonym, isPseudonymAvailable, toMe } from '../services/users.js';

import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

function localeOf(header: string | string[] | undefined): Locale {
  const value = Array.isArray(header) ? header[0] : header;
  return isLocale(value) ? value : 'de';
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env, mailer } = app.ctx;

  const sessionResponse = async (result: SessionResult) => ({
    token: result.token,
    sessionId: result.sessionId,
    isNew: result.isNew,
    needsOnboarding: result.user.onboardingCompletedAt === null,
    me: await toMe(db, result.user),
  });

  app.post('/email/code', { schema: { body: requestEmailCodeSchema } }, async (request, reply) => {
    await app.rateLimit(`email-code:${request.body.email}`, 5, 15 * 60);
    if (request.deviceHash)
      await app.rateLimit(`email-code:device:${request.deviceHash}`, 10, 60 * 60);
    await requestEmailCode(
      db,
      env,
      mailer,
      request.body.email,
      localeOf(request.headers['x-locale']),
    );
    return reply.status(202).send({ sent: true });
  });

  app.post('/email/verify', { schema: { body: verifyEmailCodeSchema } }, async (request) => {
    await app.rateLimit(`email-verify:${request.body.email}`, 10, 15 * 60);
    const result = await signInWithEmailCode(
      db,
      env,
      request.body.email,
      request.body.code,
      localeOf(request.headers['x-locale']),
      describeDevice(request.headers['user-agent']),
    );
    return sessionResponse(result);
  });

  app.post(
    '/passkey/options',
    { schema: { body: z.object({ intent: z.enum(['register', 'authenticate']) }) } },
    async (request) => {
      if (request.body.intent === 'register') {
        const { user } = request.requireActiveUser();
        return passkeyRegistrationOptions(db, env, user);
      }
      if (request.deviceHash)
        await app.rateLimit(`passkey-options:${request.deviceHash}`, 30, 10 * 60);
      return passkeyAuthenticationOptions(db, env);
    },
  );

  app.post('/passkey/verify', { schema: { body: passkeyVerifySchema } }, async (request) => {
    if (request.body.intent === 'register') {
      const { user } = request.requireActiveUser();
      await passkeyRegistrationVerify(
        db,
        env,
        user,
        request.body.challengeId,
        request.body.response as unknown as RegistrationResponseJSON,
        request.body.name ?? describeDevice(request.headers['user-agent']),
      );
      return { registered: true };
    }
    const result = await passkeyAuthenticationVerify(
      db,
      env,
      request.body.challengeId,
      request.body.response as unknown as AuthenticationResponseJSON,
      describeDevice(request.headers['user-agent']),
    );
    return sessionResponse(result);
  });

  app.post('/apple', { schema: { body: appleSignInSchema } }, async (request) => {
    if (request.deviceHash) await app.rateLimit(`apple:${request.deviceHash}`, 20, 10 * 60);
    const result = await signInWithApple(
      db,
      env,
      request.body.identityToken,
      request.body.nonce,
      localeOf(request.headers['x-locale']),
      describeDevice(request.headers['user-agent']),
    );
    return sessionResponse(result);
  });

  app.post(
    '/pseudonym/check',
    { schema: { body: pseudonymAvailabilitySchema } },
    async (request) => {
      const available = await isPseudonymAvailable(
        db,
        request.body.pseudonym,
        request.auth?.user.id,
      );
      return { available };
    },
  );

  /** Steps 6.3–6.6 of onboarding, in one call once the person confirmed everything. */
  app.post('/onboarding', { schema: { body: completeOnboardingSchema } }, async (request) => {
    const { user } = request.requireUser();
    if (user.onboardingCompletedAt) return { me: await toMe(db, user) };
    if (!(await isPseudonymAvailable(db, request.body.pseudonym, user.id)))
      throw new ApiError('PSEUDONYM_TAKEN');
    const now = new Date();
    const [updated] = await db
      .update(users)
      .set({
        pseudonym: request.body.pseudonym,
        locale: request.body.locale,
        roomLocales: request.body.roomLocales,
        ageConfirmedAt: now,
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
      .returning();
    if (!updated) throw new ApiError('INTERNAL');
    return { me: await toMe(db, updated) };
  });

  app.post('/recovery/confirm', async (request) => {
    const { user } = request.requireUser();
    await db
      .update(users)
      .set({ recoverySetupAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return { ok: true };
  });

  /** Re-authentication before sensitive views (recovery code): a fresh code to the account address. */
  app.post('/reauth/code', async (request, reply) => {
    const { user } = request.requireUser();
    await app.rateLimit(`reauth:${user.id}`, 5, 15 * 60);
    await requestEmailCode(db, env, mailer, user.email, user.locale, 'login', user.id);
    return reply.status(202).send({ sent: true });
  });

  app.post(
    '/reauth/verify',
    { schema: { body: z.object({ code: z.string().regex(/^\d{6}$/) }) } },
    async (request) => {
      const { user } = request.requireUser();
      await consumeEmailCode(db, env, user.email, request.body.code, 'login');
      return { ok: true };
    },
  );

  app.post('/sign-out', async (request) => {
    const auth = request.auth;
    if (auth) await revokeSession(db, auth.sessionId, auth.user.id);
    return { ok: true };
  });

  app.post('/pseudonym', { schema: { body: pseudonymAvailabilitySchema } }, async (request) => {
    const { user } = request.requireActiveUser();
    await changePseudonym(db, user, request.body.pseudonym);
    return { ok: true };
  });
};
