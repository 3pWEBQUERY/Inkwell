'use server';

import { failure, type ActionResult } from '@/lib/api-errors';

import { getRoomFeed } from './queries';

import type { CursorPage, FeedPost, FeedSort } from '@inkwell/shared';

/** Cursor pagination for room feeds, called from the "load more" button. */
export async function loadRoomPage(
  slug: string,
  sort: FeedSort,
  cursor?: string,
): Promise<ActionResult<CursorPage<FeedPost>>> {
  try {
    const page = await getRoomFeed(slug, { sort, ...(cursor ? { cursor } : {}) });
    return { ok: true, data: page };
  } catch (error) {
    return failure(error);
  }
}
