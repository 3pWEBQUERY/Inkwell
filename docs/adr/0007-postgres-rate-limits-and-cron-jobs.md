# 0007 – Postgres-backed rate limits and cron-triggered jobs

**Status:** accepted · 2026-10-13

## Context

Rate limits and background work (expiry, ranking, exports, deletions) need
shared state across API instances. A Redis would be another service to run.

## Decision

- Fixed-window counters in a `rate_limits` table, keyed by account or hashed
  device id, never by raw IP.
- Jobs are idempotent routes under `/v1/jobs/*`, called by Railway cron with
  `X-Cron-Secret`. Hourly: expiry, ranking materialisation, exports, pruning.
  Daily: account purge after the 30-day grace period.

## Consequences

- One database, no extra service at launch.
- The `rateLimit` decorator has a single call site per limit; swapping the
  implementation for Redis later touches one file.
