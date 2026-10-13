'use server';

import { failure, type ActionResult } from '@/lib/api-errors';

import { getTodayFeed } from './queries';

import type { FeedPost } from '@inkwell/shared';

export async function refreshToday(): Promise<ActionResult<FeedPost[]>> {
  try {
    return { ok: true, data: await getTodayFeed() };
  } catch (error) {
    return failure(error);
  }
}
