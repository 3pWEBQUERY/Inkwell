import { z } from 'zod';

import { emailSchema, localeSchema, pseudonymSchema } from './common.js';

export const requestEmailCodeSchema = z.object({
  email: emailSchema,
});

export const verifyEmailCodeSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const passwordSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const passkeyOptionsSchema = z.object({
  intent: z.enum(['register', 'authenticate']),
  /** Required for registration of a new passkey on an existing account. */
  name: z.string().trim().min(1).max(60).optional(),
});

export const passkeyVerifySchema = z.object({
  intent: z.enum(['register', 'authenticate']),
  challengeId: z.string().min(10),
  response: z.record(z.string(), z.unknown()),
  name: z.string().trim().min(1).max(60).optional(),
});

export const appleSignInSchema = z.object({
  identityToken: z.string().min(10),
  nonce: z.string().min(8).max(128).optional(),
});

export const completeOnboardingSchema = z.object({
  ageConfirmed: z.literal(true),
  pseudonym: pseudonymSchema,
  roomLocales: z.array(localeSchema).min(1).max(4),
  locale: localeSchema,
});

export const pseudonymAvailabilitySchema = z.object({
  pseudonym: pseudonymSchema,
});

export type RequestEmailCodeInput = z.infer<typeof requestEmailCodeSchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;
export type PasswordSignInInput = z.infer<typeof passwordSignInSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
