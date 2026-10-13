import { z } from 'zod';

import { FLAG_STATUSES, MODERATION_ACTIONS } from '../constants.js';

export const moderationActionSchema = z.object({
  action: z.enum(MODERATION_ACTIONS),
  /** Shown to the affected person in plain words. Required for every action but "keep". */
  note: z.string().trim().max(1_000).optional(),
});

export const queueQuerySchema = z.object({
  status: z.enum(FLAG_STATUSES).optional(),
  cursor: z.string().optional(),
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
