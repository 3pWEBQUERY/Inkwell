import { z } from 'zod';

import { LIMITS, REACTION_KINDS, REPORT_REASONS } from '../constants.js';

import { idSchema } from './common.js';

export const reactionKindSchema = z.enum(REACTION_KINDS);

export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const createCommentSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('reply'),
    body: z.string().trim().min(1).max(LIMITS.commentMaxChars),
  }),
  z.object({
    mode: z.literal('feedback'),
    /** "What worked well" */
    worked: z.string().trim().min(1).max(LIMITS.commentMaxChars),
    /** "What I did not understand" */
    unclear: z.string().trim().min(1).max(LIMITS.commentMaxChars),
  }),
]);

export const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: idSchema,
  reason: z.enum(REPORT_REASONS),
  freeText: z.string().trim().max(LIMITS.reportFreeTextMaxChars).optional(),
});

export const blockSchema = z.object({
  /** Block by text or comment so anonymous authors can be blocked without being revealed. */
  targetType: z.enum(['post', 'comment', 'pseudonym']),
  targetId: z.string().min(1).max(64),
});

export const createSeriesSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.titleMaxChars),
  description: z.string().trim().max(LIMITS.seriesDescriptionMaxChars).default(''),
});

export const reorderSeriesSchema = z.object({
  postIds: z.array(idSchema).min(1).max(500),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
