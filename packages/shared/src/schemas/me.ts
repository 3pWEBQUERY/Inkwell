import { z } from 'zod';

import { EXPIRIES, VISIBILITIES } from '../constants.js';

import { localeSchema, pseudonymSchema } from './common.js';

export const userSettingsSchema = z.object({
  defaultVisibility: z.enum(VISIBILITIES),
  defaultExpiry: z.enum(EXPIRIES),
  fontSize: z.number().int().min(17).max(22),
  editorFont: z.enum(['serif', 'sans']),
  theme: z.enum(['light', 'dark', 'system']),
  reduceMotion: z.enum(['system', 'reduce']),
  dailyFeedbackDigest: z.boolean(),
  commentNotifications: z.boolean(),
});

export const updateMeSchema = z
  .object({
    pseudonym: pseudonymSchema.optional(),
    locale: localeSchema.optional(),
    roomLocales: z.array(localeSchema).min(1).max(4).optional(),
    avatar: z
      .string()
      .regex(/^(shape:[a-z]+-\d{1,2}|upload:[a-z0-9]+)$/)
      .optional(),
    settings: userSettingsSchema.partial().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'empty update' });

export const pushSubscriptionSchema = z.object({
  endpoint: z.url().max(2_000),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
  /** Which rooms (by id) and series this subscription wants. */
  roomIds: z.array(z.string()).max(200).optional(),
  seriesIds: z.array(z.string()).max(200).optional(),
});

export const renamePasskeySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const changeEmailSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
});

export const confirmEmailChangeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
