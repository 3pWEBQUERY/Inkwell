/**
 * Railway Infrastructure as Code for the Inkwell project.
 *
 * One file describes the whole environment: the two application services, the
 * Postgres database, the object storage bucket and the two cron services that
 * trigger the API's background jobs. `railway config plan` diffs this file
 * against the linked environment; `railway config apply` commits the diff.
 *
 * Secrets are never written here. Generated values (session secret, internal
 * token, VAPID key pair) and provider credentials stay on Railway and are
 * declared as `preserve()`.
 */
import {
  bucket,
  defineRailway,
  github,
  group,
  image,
  postgres,
  preserve,
  project,
  ref,
  service,
} from 'railway/iac';

/** Repository and branch Railway builds from. Switch to `main` once the work is merged. */
const REPO = '3pWEBQUERY/Inkwell';
const BRANCH = 'claude/practical-shannon-vjucvf';

/** Everything lives in the EU: compute in Amsterdam, bucket in Amsterdam. */
const REGION = 'europe-west4-drams3a';
const BUCKET_REGION = 'ams';

/** Public origin of the web service. Replace with the custom domain when it is attached. */
const PUBLIC_ORIGIN = 'https://web-production-2bf10.up.railway.app';
const PUBLIC_HOST = PUBLIC_ORIGIN.replace(/^https:\/\//, '');

const API_PORT = 4000;

/** Files whose changes trigger a rebuild of the respective service. */
const sharedWatch = ['packages/**', 'pnpm-lock.yaml', 'turbo.json'];

/**
 * Node one-liner used by the cron services: POST the job URL with both
 * secrets, print the response, exit non-zero on failure so Railway records it.
 */
const CRON_RUNNER =
  "node -e \"fetch(process.env.JOB_URL,{method:'POST',headers:{'x-internal-token':process.env.API_INTERNAL_TOKEN,'x-cron-secret':process.env.CRON_SECRET}}).then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.error(e);process.exit(1)})\"";

export default defineRailway(() => {
  const db = postgres('Postgres');
  const storage = bucket('inkwell-storage', { region: BUCKET_REGION });

  // Railpack installs the workspace (devDependencies included) before the build command runs.
  const api = service('api', {
    source: github(REPO, { branch: BRANCH }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'pnpm turbo run build --filter=@inkwell/api',
      watchPatterns: ['apps/api/**', ...sharedWatch],
    },
    deploy: {
      startCommand: 'node apps/api/dist/server.js',
      preDeployCommand: [
        'pnpm --filter @inkwell/api db:migrate && pnpm --filter @inkwell/api db:seed',
      ],
      healthcheckPath: '/health/ready',
      healthcheckTimeout: 120,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 5,
      multiRegionConfig: { [REGION]: { numReplicas: 1 } },
    },
    networking: { privateNetworkEndpoint: 'api' },
    env: {
      NODE_ENV: 'production',
      PORT: String(API_PORT),
      // Railway's private network is IPv6; listen on every interface.
      HOST: '::',
      LOG_LEVEL: 'info',
      APP_ORIGIN: PUBLIC_ORIGIN,
      RP_ID: PUBLIC_HOST,
      DATABASE_URL: db.env.DATABASE_URL,
      // Generated once; rotate on Railway, never in source.
      API_INTERNAL_TOKEN: preserve(),
      SESSION_SECRET: preserve(),
      CRON_SECRET: preserve(),
      // Mail goes through Resend over SMTP. Stays on `console` (codes only in the
      // api logs) until the sending domain is verified in Resend; then set
      // MAIL_TRANSPORT to 'smtp', MAIL_FROM to an address on that domain and
      // SMTP_PASS to the Resend API key on Railway.
      MAIL_TRANSPORT: 'console',
      MAIL_FROM: 'Inkwell <no-reply@inkwell.app>',
      SMTP_HOST: 'smtp.resend.com',
      SMTP_PORT: '465',
      SMTP_USER: 'resend',
      SMTP_PASS: preserve(),
      // Object storage: avatars and export archives in the Railway bucket.
      S3_ENDPOINT: ref(storage, 'ENDPOINT'),
      S3_REGION: ref(storage, 'REGION'),
      S3_BUCKET: ref(storage, 'BUCKET'),
      S3_ACCESS_KEY_ID: ref(storage, 'ACCESS_KEY_ID'),
      S3_SECRET_ACCESS_KEY: ref(storage, 'SECRET_ACCESS_KEY'),
      S3_FORCE_PATH_STYLE: '0',
      // Web Push.
      VAPID_PUBLIC_KEY: preserve(),
      VAPID_PRIVATE_KEY: preserve(),
      VAPID_SUBJECT: PUBLIC_ORIGIN,
      E2E_MAILBOX: '0',
    },
  });

  const web = service('web', {
    source: github(REPO, { branch: BRANCH }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'pnpm turbo run build --filter=@inkwell/web',
      watchPatterns: ['apps/web/**', ...sharedWatch],
    },
    deploy: {
      // Next.js standalone output needs public/ and .next/static next to server.js.
      startCommand: [
        'cp -r apps/web/public apps/web/.next/standalone/apps/web/',
        'mkdir -p apps/web/.next/standalone/apps/web/.next',
        'cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/',
        'node apps/web/.next/standalone/apps/web/server.js',
      ].join(' && '),
      healthcheckPath: '/api/health',
      healthcheckTimeout: 120,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 5,
      multiRegionConfig: { [REGION]: { numReplicas: 1 } },
    },
    networking: { privateNetworkEndpoint: 'web' },
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '::',
      API_URL: `http://\${{api.RAILWAY_PRIVATE_DOMAIN}}:${API_PORT}`,
      API_INTERNAL_TOKEN: api.env.API_INTERNAL_TOKEN,
      SESSION_COOKIE_NAME: 'inkwell_session',
      // "*" = no network restriction while the team has no fixed addresses; the
      // admin role still gates /admin. Replace with the operators' IPs or CIDRs.
      ADMIN_IP_ALLOWLIST: '*',
      NEXT_PUBLIC_APP_ORIGIN: PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_VERSION: '0.1.0',
      NEXT_PUBLIC_BUILD_ID: '${{RAILWAY_GIT_COMMIT_SHA}}',
      NEXT_TELEMETRY_DISABLED: '1',
      TURBO_TELEMETRY_DISABLED: '1',
    },
  });

  const cronJob = (name: string, schedule: string, path: string) =>
    service(name, {
      source: image('node:22-alpine'),
      deploy: {
        startCommand: CRON_RUNNER,
        cronSchedule: schedule,
        restartPolicyType: 'NEVER',
        multiRegionConfig: { [REGION]: { numReplicas: 1 } },
      },
      env: {
        JOB_URL: `http://\${{api.RAILWAY_PRIVATE_DOMAIN}}:${API_PORT}${path}`,
        API_INTERNAL_TOKEN: api.env.API_INTERNAL_TOKEN,
        CRON_SECRET: api.env.CRON_SECRET,
      },
    });

  // Expiry, fiction scores, pending exports, pruning: every hour.
  const jobsHourly = cronJob('jobs-hourly', '0 * * * *', '/v1/jobs/hourly');
  // Account purge after the 30-day grace period: nightly, off-peak.
  const jobsDaily = cronJob('jobs-daily', '10 3 * * *', '/v1/jobs/daily');

  return project('Inkwell', {
    resources: [
      group('Edge', [web]),
      group('Backend', [api, jobsHourly, jobsDaily]),
      group('Data', [db, storage]),
    ],
  });
});
