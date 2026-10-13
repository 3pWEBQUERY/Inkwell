import { HTTP_STATUS_BY_CODE, type ApiErrorBody, type ErrorCode } from '@inkwell/shared';

/** The only error shape the API returns: `{ error: "CODE", details?: {...} }`. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = HTTP_STATUS_BY_CODE[code];
    this.details = details;
  }

  toBody(): ApiErrorBody {
    return this.details ? { error: this.code, details: this.details } : { error: this.code };
  }
}

export function fail(code: ErrorCode, details?: Record<string, unknown>): never {
  throw new ApiError(code, details);
}
