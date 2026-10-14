# 0009 Railway topology declared as Infrastructure as Code

Status: accepted

## Context

The PRD asks for EU hosting on Railway with Postgres, object storage for
avatars and export archives, and scheduled background jobs. Railway deprecated
per-service `railway.json` (Config as Code, read until 2026-12-01) in favour of
one `.railway/railway.ts` per project that the Railway CLI plans and applies.
The platform has five moving parts (web, api, Postgres, bucket, cron) whose
wiring (variable references, private endpoints, schedules) is easy to get wrong
when clicked together in a dashboard.

## Decision

- One Railway project, one environment to start with, everything in Amsterdam:
  compute in `europe-west4`, the bucket in `ams`.
- The whole topology lives in `.railway/railway.ts`, type-checked and linted
  like application code. Secrets are `preserve()`d; the file never carries a
  value that must not be in git.
- `web` is the only public service. `api` is reachable only through the private
  network (`api.railway.internal:4000`) and additionally checks the shared
  internal token.
- Background jobs are two tiny cron services running `node:22-alpine` that POST
  to the API with the cron secret, instead of a scheduler inside the API
  process (see ADR 0007). Exports are additionally built inline on request, so
  users never wait for a schedule.
- Storage is the Railway bucket through its S3 API with virtual-host
  addressing; the API keeps a path-style switch for other providers and an
  in-memory fallback for local development.
- Builds use Railpack from the monorepo root with per-service watch patterns,
  so a change under `apps/web` does not rebuild the API. Migrations and the
  room seed run as the API's pre-deploy command; a failing migration stops the
  deploy before traffic switches.
- Changes to the topology go through pull requests: the `railwayapp/config`
  action plans on the PR and applies the reviewed plan on merge.

## Consequences

- `pnpm install` must work outside a git checkout, so the git-hook install is
  guarded (`scripts/prepare.mjs`).
- A second environment (staging) is a `railway environment` plus a
  `ctx.environment` branch in the file, not a second set of dashboard clicks.
- The public hostname appears in one constant; attaching the custom domain
  means changing it there, redeploying, and registering passkeys afresh on the
  final domain.
