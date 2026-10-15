'use client';

import { cryptoClient } from '@/features/crypto/client';
import { db, type EntryRecord } from '@/lib/db';
import { isSealed } from '@/lib/letters';

import type { JournalPost } from '@inkwell/shared';

/**
 * Merges the server's journal page into the local copy and decrypts private
 * entries when the key is present. The search text is derived here and never
 * leaves the browser.
 */
export async function syncJournal(items: JournalPost[], hasKey: boolean): Promise<EntryRecord[]> {
  const records: EntryRecord[] = [];
  for (const item of items) {
    const existing = await db().entries.get(item.id);
    let body = item.body;
    let title = item.title;
    let locked = false;

    if (item.visibility === 'private' && isSealed(item.opensAt)) {
      // A sealed letter is not decrypted, so its text is not even in the local search index.
      body = null;
      title = null;
    } else if (item.visibility === 'private') {
      if (existing?.body && existing.updatedAt === item.updatedAt) {
        body = existing.body;
        title = existing.title;
      } else if (hasKey && item.ciphertext && item.nonce && item.wrappedKey) {
        try {
          const plain = await cryptoClient.decrypt({
            ciphertext: item.ciphertext,
            nonce: item.nonce,
            wrappedKey: item.wrappedKey,
          });
          const parsed = splitTitle(plain);
          body = parsed.body;
          title = parsed.title;
        } catch {
          locked = true;
        }
      } else {
        locked = true;
      }
    }

    const record: EntryRecord = {
      id: item.id,
      type: item.type,
      visibility: item.visibility,
      status: item.status,
      title,
      body,
      ciphertext: item.ciphertext,
      nonce: item.nonce,
      wrappedKey: item.wrappedKey,
      roomSlug: item.roomSlug,
      roomName: item.roomName,
      expiry: item.expiry,
      expiresAt: item.expiresAt,
      opensAt: item.opensAt,
      seriesId: item.seriesId,
      chapter: item.chapter,
      hasFeedback: item.hasFeedback,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      searchText: `${title ?? ''}\n${body ?? ''}`.toLowerCase(),
      locked,
    };
    records.push(record);
  }
  await db().entries.bulkPut(records);
  return records;
}

export function splitTitle(plain: string): { title: string | null; body: string } {
  const lines = plain.split('\n');
  if (lines[0]?.startsWith('# '))
    return { title: lines[0].slice(2).trim(), body: lines.slice(2).join('\n') };
  return { title: null, body: plain };
}

/** Removes entries the server no longer has (burned elsewhere). */
export async function pruneJournal(serverIds: Set<string>): Promise<void> {
  const local = await db().entries.toCollection().primaryKeys();
  const stale = local.filter((id) => !serverIds.has(id));
  if (stale.length > 0) await db().entries.bulkDelete(stale);
}
