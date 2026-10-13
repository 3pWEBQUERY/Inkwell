# Inkwell

A quiet place to write. Thoughts, journal, short stories. Every text starts
private; sharing is a deliberate choice afterwards, not the point of writing.

> Schreib dir alles von der Seele. Teile es, wenn du willst. Oder lass es los.

This repository holds the web platform described in [`docs/prd.md`](docs/prd.md):
a Next.js app (landing page, app shell, editor, PWA) and a Fastify API (data,
rules, moderation), deployed on Railway in the EU.

## Principles that shape the code

1. Writing first: the editor is empty, visibility is decided afterwards.
2. No public numbers: reactions are only ever aggregated for the author.
3. No engagement algorithm: feeds are chronological or follow room rules.
4. Letting go is a feature: expiry after 24 h or 7 days, burning is final.
5. Quiet by default: no streaks, no badges, push only where subscribed.
6. Private means private: private entries are encrypted in the browser.
7. Safety before reach: reporting, review queue, suspensions are in the MVP.

## Layout

```
apps/web        Next.js 16, App Router, next-intl, Tailwind 4, Tiptap, Dexie, Serwist
apps/api        Fastify 5, Drizzle + Postgres, zod, pino, web-push, simplewebauthn
packages/shared error codes, zod schemas, domain types, Markdown subset, helplines
packages/config tsconfig, eslint (flat), prettier
docs/           prd.md, adr/
```

## Getting started

Requirements: Node 22.12+, pnpm 10, PostgreSQL 16.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env      # set DATABASE_URL and the secrets
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate && pnpm db:seed             # schema + 15 rooms per language
pnpm dev                                    # api on :4000, web on :3000
```

Create an admin: set `roles = '{member,admin}'` on your user row; `/admin` is
additionally gated by `ADMIN_IP_ALLOWLIST`.

## Quality gates

```sh
pnpm typecheck   # strict TypeScript, noUncheckedIndexedAccess, exactOptionalPropertyTypes
pnpm lint        # typescript-eslint strict, react-hooks, jsx-a11y, import order; zero warnings
pnpm test        # vitest: shared, api (unit), web (crypto, crisis, serializer, queue)
pnpm build       # turbo: shared → api + web (incl. service worker)
```

`pnpm --filter @inkwell/api test:integration` runs the API against a real
Postgres (`DATABASE_URL`), including the five core flows end to end.
`pnpm test:e2e` drives the browser flows with Playwright. CI runs all of it on
every pull request (`.github/workflows/ci.yml`).

## Conventions

English everywhere in the codebase; German, French, Italian only in
`messages/*.json`, `content/` and user-facing copy. Conventional Commits,
changesets for the public changelog, ADRs in `docs/adr/` for every non-obvious
decision. See `docs/prd.md` section 12.5 for the full set.

## Deployment

One Railway project, two environments (staging, production), region EU.
Services: `web`, `api`, `postgres`, a bucket for avatars and exports, and cron
jobs calling `/v1/jobs/hourly`, `/v1/jobs/exports`, `/v1/jobs/daily`.
`.github/workflows/deploy.yml` triggers the Railway deploys after CI is green.
