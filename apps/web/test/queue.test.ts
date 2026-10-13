import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/posts/actions', () => ({
  createPost: vi.fn(async (payload: { body?: string }) =>
    payload.body === 'fail'
      ? { ok: false, error: 'INTERNAL' }
      : { ok: true, data: { id: 'x', createdAt: '', post: null } },
  ),
}));

import { enqueuePublish, flushQueue, pendingCount } from '@/features/offline/queue';

describe('publish queue', () => {
  it('stores operations and flushes them in order', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
    const base = {
      visibility: 'anonymous' as const,
      type: 'thought' as const,
      title: null,
      roomId: 'r'.repeat(24),
      expiry: 'none' as const,
      seriesId: null,
      clientId: crypto.randomUUID(),
    };
    await enqueuePublish({ ...base, body: 'first text that is long enough' });
    await enqueuePublish({ ...base, body: 'fail', clientId: crypto.randomUUID() });
    expect(await pendingCount()).toBe(2);
    const result = await flushQueue();
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    // The failed one stays for a retry.
    expect(await pendingCount()).toBe(1);
  });
});
