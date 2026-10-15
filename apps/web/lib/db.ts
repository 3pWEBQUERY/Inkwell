import Dexie, { type EntityTable } from 'dexie';

import type { Expiry, PostStatus, PostType, Visibility } from '@inkwell/shared';

/** An encrypted draft; the editor autosaves here every two seconds. Drafts never reach the server. */
export interface DraftRecord {
  id: string;
  ciphertext: string;
  nonce: string;
  wrappedKey: string;
  updatedAt: number;
}

/** Local copy of a journal entry. Private entries keep their decrypted text here for search; the index never leaves the browser. */
export interface EntryRecord {
  id: string;
  type: PostType;
  visibility: Visibility;
  status: PostStatus;
  title: string | null;
  /** Plaintext Markdown (shared entries from the server, private entries after local decryption). */
  body: string | null;
  ciphertext: string | null;
  nonce: string | null;
  wrappedKey: string | null;
  roomSlug: string | null;
  roomName: string | null;
  expiry: Expiry;
  expiresAt: string | null;
  /** Sealed letters: no plaintext is kept locally until this moment. Missing on older records. */
  opensAt?: string | null;
  seriesId: string | null;
  chapter: number | null;
  hasFeedback: boolean;
  createdAt: string;
  updatedAt: string;
  /** Lowercased search text, derived from title + body. */
  searchText: string;
  locked: boolean;
}

export interface ReadProgressRecord {
  postId: string;
  ratio: number;
  updatedAt: number;
  /** For "continue reading" on Today; kept only in this browser. Missing on older records. */
  title?: string | null;
  line?: string;
  roomName?: string;
}

/** A passage a reader kept while reading. Stays in this browser only. */
export interface PassageRecord {
  id: string;
  postId: string;
  text: string;
  /** Title or first line of the text it came from. */
  source: string;
  roomName: string;
  /** Pseudonym, or null for anonymous texts. */
  author: string | null;
  createdAt: number;
}

/** A publish operation waiting for connectivity. */
export interface QueueRecord {
  id: string;
  kind: 'createPost';
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export interface MetaRecord {
  key: string;
  value: string;
}

class InkwellDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, 'id'>;
  entries!: EntityTable<EntryRecord, 'id'>;
  readProgress!: EntityTable<ReadProgressRecord, 'postId'>;
  queue!: EntityTable<QueueRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;
  passages!: EntityTable<PassageRecord, 'id'>;

  constructor() {
    super('inkwell');
    this.version(1).stores({
      drafts: 'id, updatedAt',
      entries: 'id, visibility, createdAt, updatedAt, expiresAt',
      readProgress: 'postId, updatedAt',
      queue: 'id, createdAt',
      meta: 'key',
    });
    this.version(2).stores({
      passages: 'id, createdAt, postId',
    });
  }
}

let instance: InkwellDatabase | null = null;

export function db(): InkwellDatabase {
  if (!instance) instance = new InkwellDatabase();
  return instance;
}

export async function clearLocalData(): Promise<void> {
  const database = db();
  await Promise.all([
    database.drafts.clear(),
    database.entries.clear(),
    database.readProgress.clear(),
    database.queue.clear(),
    database.meta.clear(),
    database.passages.clear(),
  ]);
}
