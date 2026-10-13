import { z } from 'zod';

/**
 * Server-side environment, validated at module load. The build fails on a
 * missing variable instead of a page failing at runtime.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_URL: z.url(),
  API_INTERNAL_TOKEN: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().min(1).default('inkwell_session'),
  ADMIN_IP_ALLOWLIST: z.string().default(''),
  NEXT_PUBLIC_APP_ORIGIN: z.url(),
  NEXT_PUBLIC_APP_VERSION: z.string().default('0.1.0'),
  NEXT_PUBLIC_BUILD_ID: z.string().default('dev'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment:\n  ${issues.join('\n  ')}`);
  }
  cached = parsed.data;
  return cached;
}

/** Values safe to inline into the client bundle. */
export const publicEnv = {
  appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
  buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev',
};
