import { z } from 'zod';

import {
  EXPIRIES,
  FEED_SORTS,
  LETTER_DELAYS,
  LIMITS,
  POST_TYPES,
  VISIBILITIES,
} from '../constants.js';

import { base64urlSchema, cursorSchema, idSchema } from './common.js';

const titleSchema = z.string().trim().min(1).max(LIMITS.titleMaxChars);

/** A private entry: the browser encrypted it, the server stores opaque bytes. */
export const createPrivatePostSchema = z.object({
  visibility: z.literal('private'),
  type: z.enum(POST_TYPES),
  ciphertext: base64urlSchema.min(1),
  nonce: base64urlSchema.min(12),
  wrappedKey: base64urlSchema.min(16),
  /** Seals the entry as a letter to one's later self; the server sets the opening date. */
  sealFor: z.enum(LETTER_DELAYS).optional(),
  /** Client-side id, so an offline-created entry keeps its identity when it syncs. */
  clientId: z.uuid().optional(),
});

/** A shared entry: plaintext plus the room it goes to. */
export const createSharedPostSchema = z.object({
  visibility: z.enum(['anonymous', 'public']),
  type: z.enum(POST_TYPES),
  title: titleSchema.nullable().default(null),
  body: z
    .string()
    .min(1)
    .max(LIMITS.storyMaxChars + 4_000),
  roomId: idSchema,
  expiry: z.enum(EXPIRIES).default('none'),
  commentsEnabled: z.boolean().optional(),
  seriesId: idSchema.nullable().default(null),
  clientId: z.uuid().optional(),
});

export const createPostSchema = z.discriminatedUnion('visibility', [
  createPrivatePostSchema.extend({ visibility: z.literal('private') }),
  createSharedPostSchema.extend({ visibility: z.literal('anonymous') }),
  createSharedPostSchema.extend({ visibility: z.literal('public') }),
]);

export const updatePostSchema = z
  .object({
    title: titleSchema.nullable().optional(),
    body: z
      .string()
      .min(1)
      .max(LIMITS.storyMaxChars + 4_000)
      .optional(),
    /** Narrowing only. Switching to private requires the ciphertext triple. */
    visibility: z.enum(VISIBILITIES).optional(),
    ciphertext: base64urlSchema.optional(),
    nonce: base64urlSchema.optional(),
    wrappedKey: base64urlSchema.optional(),
    commentsEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'empty update' });

export const roomFeedQuerySchema = z.object({
  cursor: cursorSchema,
  sort: z.enum(FEED_SORTS).optional(),
});

export const journalQuerySchema = z.object({
  cursor: cursorSchema,
  /** Clients that sync incrementally pass the last known `updatedAt`. */
  since: z.iso.datetime().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreatePrivatePostInput = z.infer<typeof createPrivatePostSchema>;
export type CreateSharedPostInput = z.infer<typeof createSharedPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
