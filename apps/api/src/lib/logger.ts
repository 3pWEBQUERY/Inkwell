import pino, { type Logger, type LoggerOptions } from 'pino';

import type { Env } from '../env.js';

/**
 * Structured logs. Request logs never carry the full client IP; a salted hash is
 * enough for abuse correlation and is dropped after 7 days by log retention.
 */
export function createLogger(env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>): Logger {
  const options: LoggerOptions = {
    level: env.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-internal-token"]'],
      censor: '[redacted]',
    },
    base: { service: 'api' },
  };
  if (env.NODE_ENV === 'development') {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' },
    };
  }
  return pino(options);
}
