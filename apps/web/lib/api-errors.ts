import { isApiErrorBody, type ErrorCode } from '@inkwell/shared';

/** Thrown by the API client; carries the server code so the UI can localise it. */
export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, status: number, details?: Record<string, unknown>) {
    super(code);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static fromResponse(status: number, body: unknown): ApiClientError {
    if (isApiErrorBody(body)) return new ApiClientError(body.error, status, body.details);
    return new ApiClientError('INTERNAL', status);
  }
}

/** Serialisable result for server actions: never throw across the boundary. */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ErrorCode; details?: Record<string, unknown> };

export function failure(error: unknown): ActionResult<never> {
  if (error instanceof ApiClientError) {
    return error.details
      ? { ok: false, error: error.code, details: error.details }
      : { ok: false, error: error.code };
  }
  return { ok: false, error: 'INTERNAL' };
}
