import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/lib/errors.js';

describe('ApiError', () => {
  it('maps codes to status and body', () => {
    const error = new ApiError('POST_TOO_SHORT', { min: 20 });
    expect(error.status).toBe(400);
    expect(error.toBody()).toEqual({ error: 'POST_TOO_SHORT', details: { min: 20 } });
  });

  it('omits details when none were given', () => {
    expect(new ApiError('UNAUTHENTICATED').toBody()).toEqual({ error: 'UNAUTHENTICATED' });
    expect(new ApiError('RATE_LIMITED').status).toBe(429);
  });
});
