import { ApiError } from './errors.js';

export interface Cursor {
  createdAt: Date;
  id: string;
}

/** Opaque keyset cursors: base64url of `<iso>|<id>`. */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.createdAt.toISOString()}|${cursor.id}`).toString('base64url');
}

export function decodeCursor(value: string | undefined): Cursor | null {
  if (!value) return null;
  const decoded = Buffer.from(value, 'base64url').toString('utf8');
  const [iso, id] = decoded.split('|');
  if (!iso || !id) throw new ApiError('VALIDATION_FAILED', { field: 'cursor' });
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime()))
    throw new ApiError('VALIDATION_FAILED', { field: 'cursor' });
  return { createdAt, id };
}
