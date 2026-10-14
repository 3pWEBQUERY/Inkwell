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
- Turn mail on. Resend is wired up over SMTP (`smtp.resend.com:465`, user
  `resend`); what is missing is the domain. In Resend: add and verify the
  sending domain, create an API key. On Railway (`api`): set `SMTP_PASS` to that
  key, `MAIL_FROM` to an address on the verified domain, `MAIL_TRANSPORT=smtp`.
  Until then sign-in codes appear only in the `api` logs, and operators sign in
  with the password accounts below.
- Narrow `ADMIN_IP_ALLOWLIST` on `web` from `*` to the operators' IPs or CIDR
  ranges once the team has fixed addresses.
- Set `APPLE_CLIENT_ID` on `api` once Sign in with Apple is configured.
- Point `BRANCH` at `main` after the initial work is merged.

## Accounts with a password

Sign-in is by e-mail code or passkey. Accounts for operators and testers get a
password through the API script, which creates the account if needed, sets the
roles and the password, and leaves onboarding (age check, pseudonym, recovery
code) to the first sign-in. The script needs the API's `DATABASE_URL` and
`SESSION_SECRET`.

```sh
INKWELL_USERS='[{"email":"ops@example.ch","password":"…","roles":["admin"]}]' \
  railway run --service api pnpm --filter @inkwell/api users:create
```

Without the CLI, run it as a one-off service from this repository with the same
build as `api`, the start command `pnpm --filter @inkwell/api users:create`,
restart policy `NEVER`, and the variables `DATABASE_URL`, `SESSION_SECRET`
(references to Postgres and `api`) and `INKWELL_USERS`. Delete the service
afterwards so the password leaves Railway with it.

## CI

`.github/workflows/railway-config.yml` plans every pull request that touches
`.railway/` and applies the reviewed plan when the pull request merges. It needs
the repository secret `RAILWAY_TOKEN`: a project token scoped to the
`production` environment.
