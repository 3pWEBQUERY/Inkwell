# @inkwell/web

Next.js 16 (App Router) app: landing page, onboarding, the app shell with
page transitions, the editor, local encryption, offline queue and the PWA.
The only service the browser talks to; it calls the API over the private network.

## Start in three commands

```sh
cp .env.example .env.local      # API_URL, API_INTERNAL_TOKEN, NEXT_PUBLIC_APP_ORIGIN
pnpm --filter @inkwell/api dev  # in another terminal, with Postgres
pnpm dev                        # http://localhost:3000
```

## Map

| Path                            | Purpose                                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/(marketing)`      | `/`, `/privacy`, `/imprint`, `/terms`, `/changelog`, `/status`, `/press`, `/sign-in`                                                                              |
| `app/[locale]/(app)`            | shell (`layout.tsx`, `template.tsx`, `loading.tsx`), `/today`, `/rooms`, `/journal`, `/me`, `/posts/[id]`, `/series/[id]`, `/u/[pseudonym]`, `/write`, `/offline` |
| `app/[locale]/(app)/@modal`     | intercepting overlays: editor, sign-in, settings groups                                                                                                           |
| `app/[locale]/(app)/@context`   | context column on wide screens: room rules, settings groups                                                                                                       |
| `app/[locale]/(admin)`          | `/admin` review queue (admin role + IP allowlist in `proxy.ts`)                                                                                                   |
| `app/api`                       | route handlers: health, avatar proxy, export fallback, Apple redirect flow                                                                                        |
| `components/`                   | `ui/`, `shell/`, `marketing/`, `auth/`, `editor/`, `rooms/`, `reading/`, `journal/`, `profile/`, `admin/`                                                         |
| `features/`                     | `auth/` (session cookie, server actions), `posts/` (queries, actions, journal sync, export), `crypto/`, `offline/`, `crisis/`, `pwa/`                             |
| `workers/`                      | `crypto.worker.ts` (keys, encrypt, decrypt), `crisis.worker.ts` (local word-list scan)                                                                            |
| `lib/`                          | API client, local database (Dexie), formatting, site facts                                                                                                        |
| `messages/`                     | `de.json` (master), `fr.json`, `it.json`, `en.json`                                                                                                               |
| `content/`                      | legal documents per locale, changelog entries                                                                                                                     |
| `styles/`                       | `tokens.css`, `motion.css`, `globals.css` (Tailwind 4)                                                                                                            |
| `sw.ts`, `scripts/build-sw.mjs` | service worker and its esbuild bundling (runs in `prebuild`)                                                                                                      |
| `test/`, `e2e/`                 | Vitest (crypto, crisis, serializer, queue) and Playwright core flows                                                                                              |

## Environment

See `.env.example`. `env.ts` validates server variables at first use; a
missing one fails the request with a clear message instead of a vague 500.
Operator facts for the imprint come from `NEXT_PUBLIC_OPERATOR_NAME`,
`NEXT_PUBLIC_RESPONSIBLE_PERSON`, `NEXT_PUBLIC_OPERATOR_ADDRESS`,
`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_PRESS_EMAIL`.

## Checks

```sh
pnpm typecheck && pnpm lint && pnpm test   # fast, no services needed
pnpm build                                  # also bundles the service worker
pnpm test:e2e                               # needs api + web + Postgres, see playwright.config.ts
pnpm lighthouse                             # budgets in lighthouserc.json
```

## Deployment

Railway service `web`, declared in `.railway/railway.ts`, standalone output.
Railpack installs the workspace and builds with
`pnpm turbo run build --filter=@inkwell/web`; the start command copies
`public/` and `.next/static` next to the standalone server and runs
`node apps/web/.next/standalone/apps/web/server.js`. Health check `/api/health`.
The API is reached over Railway private networking (`API_URL`).
