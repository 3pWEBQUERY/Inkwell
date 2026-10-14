import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_ORIGIN: z.url(),
  RP_ID: z.string().min(1),
  API_INTERNAL_TOKEN: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  MAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
  MAIL_FROM: z.string().min(3),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('eu-central-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** "1" addresses objects as <endpoint>/<bucket>/<key> (MinIO, some providers). Railway buckets use virtual-host style. */
  S3_FORCE_PATH_STYLE: z.enum(['0', '1']).default('0'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  /** Test environments only: exposes the last sign-in code per address at GET /dev/mailbox. Refused in production. */
  E2E_MAILBOX: z.enum(['0', '1']).default('0'),
});

export type Env = z.infer<typeof schema>;

/** Validated once at startup. A missing variable stops the process before it serves a request. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment:\n  ${issues.join('\n  ')}`);
  }
  if (parsed.data.E2E_MAILBOX === '1' && parsed.data.NODE_ENV === 'production') {
    throw new Error('Invalid environment:\n  E2E_MAILBOX must not be enabled in production');
  }
  if (parsed.data.MAIL_TRANSPORT === 'smtp' && !parsed.data.SMTP_HOST) {
    throw new Error('Invalid environment:\n  SMTP_HOST is required when MAIL_TRANSPORT=smtp');
  }
  return parsed.data;
}
