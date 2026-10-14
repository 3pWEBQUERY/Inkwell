# @inkwell/api

Fastify 5 service that owns data, rules and moderation. The browser never talks
to it directly; the Next.js web service calls it over Railway private networking
with a shared internal token. A future native iOS client reaches the same API
through a public gateway.

## Start in three commands

```sh
cp .env.example .env            # fill DATABASE_URL at least
pnpm db:migrate && pnpm db:seed # schema + 15 rooms per language
pnpm dev                        # http://localhost:4000/health
```

## What lives where

| Path               | Purpose                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes`       | HTTP surface under `/v1` (auth, rooms, posts, reactions, votes, comments, series, reports, me, exports, push, media, admin, jobs) |
| `src/services`     | Rules: visibility transitions, room-kind checks, ranking, expiry, moderation, exports, deletion, spam heuristics, push copy       |
| `src/plugins`      | Request context, internal token check, session resolution, Postgres rate limiting                                                 |
| `src/db`           | Drizzle schema, migrations (`pnpm db:generate`), seeds                                                                            |
| `src/lib`          | Crypto, mail, push, object storage, avatar normalisation, ids, cursors                                                            |
| `test/unit`        | Vitest: ranking, crypto, spam, env, ids, errors                                                                                   |
| `test/integration` | Runs against a real Postgres when `DATABASE_URL` is set                                                                           |

## Rules enforced here, not in the client

- Visibility can only narrow (`public → anonymous → private`), never widen.
- Anonymous texts are rejected in fiction rooms; votes are rejected in reflection rooms (also by a database trigger).
- Thoughts are editable for 15 minutes, stories without limit.
- 20 publications per 24 h, 60 comments per hour, per account.
- Three independent reports within 24 h hide a text until review.
- Anonymous texts leave the API without `author`; the field is removed server-side.
- Private entries are stored as `ciphertext`, `nonce`, `wrapped_key` only.

## Environment

See `.env.example`. The process refuses to start when a required variable is missing.

## Background jobs

Railway cron calls these with the headers `X-Internal-Token` and `X-Cron-Secret`:

| Schedule    | Endpoint                | Work                                                                 |
| ----------- | ----------------------- | -------------------------------------------------------------------- |
| every hour  | `POST /v1/jobs/hourly`  | expire texts, materialise fiction scores, build exports, prune       |
| on request  | `POST /v1/jobs/exports` | build pending export archives (also run inline on `POST /me/export`) |
| daily 03:10 | `POST /v1/jobs/daily`   | purge accounts after the 30-day grace period                         |

## Deployment

Railway service `api`, declared in `.railway/railway.ts`. Railpack installs the
workspace, builds with `pnpm turbo run build --filter=@inkwell/api`, runs
migrations and the room seed as pre-deploy command, then starts
`node apps/api/dist/server.js`. Health check `/health/ready`. Reachable only on
the private network as `api.railway.internal:4000`. Storage points at the
Railway bucket through variable references; the database at Railway Postgres.
