import sharp from 'sharp';

import { LIMITS } from '@inkwell/shared';

import { ApiError } from './errors.js';

const ALLOWED_INPUT = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

/**
 * Normalises an uploaded avatar: validates the type, strips metadata, crops to a
 * square and resizes to 512 px WebP. Nothing about the original file survives.
 */
export async function normalizeAvatar(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
  if (!ALLOWED_INPUT.has(mimeType)) throw new ApiError('AVATAR_INVALID');
  if (input.byteLength > LIMITS.avatarMaxBytes) throw new ApiError('AVATAR_TOO_LARGE');
  try {
    const output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(LIMITS.avatarSizePx, LIMITS.avatarSizePx, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toBuffer();
    return new Uint8Array(output);
  } catch {
    throw new ApiError('AVATAR_INVALID');
  }
}
