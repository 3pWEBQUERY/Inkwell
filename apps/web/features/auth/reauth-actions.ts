'use server';

import { api } from '@/lib/api-client';
import { failure, type ActionResult } from '@/lib/api-errors';

import type { Locale } from '@inkwell/shared';

/** Showing the recovery code again requires a fresh sign-in code (PRD 7.7). */
export async function reauthenticateRequest(locale: Locale): Promise<ActionResult> {
  try {
    await api('/auth/reauth/code', { method: 'POST', locale });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function reauthenticateVerify(code: string): Promise<ActionResult> {
  try {
    await api('/auth/reauth/verify', { method: 'POST', body: { code } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
