import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../src/env.js';

const base = {
  APP_ORIGIN: 'http://localhost:3000',
  RP_ID: 'localhost',
  API_INTERNAL_TOKEN: 'x'.repeat(32),
  SESSION_SECRET: 'y'.repeat(32),
  CRON_SECRET: 'z'.repeat(32),
  DATABASE_URL: 'postgres://localhost/inkwell',
  MAIL_FROM: 'Inkwell <no-reply@example.ch>',
};

describe('loadEnv', () => {
  it('accepts a complete environment with defaults', () => {
    const env = loadEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.MAIL_TRANSPORT).toBe('console');
  });

  it('fails loudly on a missing variable', () => {
    expect(() => loadEnv({ ...base, SESSION_SECRET: undefined })).toThrow(/SESSION_SECRET/);
  });

  it('requires SMTP_HOST for the smtp transport', () => {
    expect(() => loadEnv({ ...base, MAIL_TRANSPORT: 'smtp' })).toThrow(/SMTP_HOST/);
  });
});
