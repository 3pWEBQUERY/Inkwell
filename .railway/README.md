# Railway configuration

`railway.ts` is the single source of truth for the Railway project **Inkwell**
(environment `production`, region Amsterdam). Railway does not read this
directory during deploys; the Railway CLI evaluates it and applies the diff.

## Day to day

```sh
railway login
railway link                      # choose project Inkwell, environment production
railway config plan               # read-only diff against the live environment
railway config apply              # plan, confirm, apply
```

`plan` redacts variable values. Pass `--show-values` to see non-secret values.

## What lives where

| Resource                    | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `web`                       | Next.js, public domain, talks to `api` over the private network |
| `api`                       | Fastify, private only (`api.railway.internal:4000`)             |
| `Postgres`                  | Railway Postgres, EU                                            |
| `inkwell-storage`           | Railway bucket (S3 API), avatars and export archives            |
| `jobs-hourly`, `jobs-daily` | Cron services posting to `/v1/jobs/*` with the cron secret      |

Secrets (`API_INTERNAL_TOKEN`, `SESSION_SECRET`, `CRON_SECRET`, `VAPID_*`) are
declared as `preserve()`: the file keeps whatever is set on Railway. Rotate them
in the Railway dashboard, never by committing values.

## Operator checklist before going public

- Attach the custom domain to `web` and update `PUBLIC_ORIGIN` in `railway.ts`
  (`APP_ORIGIN`, `RP_ID`, `NEXT_PUBLIC_APP_ORIGIN`, `VAPID_SUBJECT` derive from it).
  Passkeys are bound to the hostname: register them only on the final domain.
- Set `MAIL_TRANSPORT=smtp` plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  for an EU mail provider. Until then sign-in codes appear only in the `api` logs.
- Fill `ADMIN_IP_ALLOWLIST` on `web` with the operators' IPs or CIDR ranges.
- Set `APPLE_CLIENT_ID` on `api` once Sign in with Apple is configured.
- Point `BRANCH` at `main` after the initial work is merged.

## CI

`.github/workflows/railway-config.yml` plans every pull request that touches
`.railway/` and applies the reviewed plan when the pull request merges. It needs
the repository secret `RAILWAY_TOKEN`: a project token scoped to the
`production` environment.
