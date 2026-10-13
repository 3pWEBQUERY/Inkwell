import { z } from 'zod';

import { LIMITS, PSEUDONYM_PATTERN } from '../constants.js';
import { LOCALES } from '../locales.js';

export const localeSchema = z.enum(LOCALES);

export const idSchema = z.string().min(10).max(64);

export const cursorSchema = z.string().min(1).max(200).optional();

export const emailSchema = z.email().trim().toLowerCase().max(254);

export const pseudonymSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(LIMITS.pseudonymMin)
  .max(LIMITS.pseudonymMax)
  .regex(PSEUDONYM_PATTERN);

/** Base64url-encoded binary payloads (ciphertext, nonce, wrapped keys). */
export const base64urlSchema = z.string().regex(/^[A-Za-z0-9_-]*$/);
