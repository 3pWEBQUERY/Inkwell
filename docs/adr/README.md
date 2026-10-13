# Architecture Decision Records

Every non-obvious architectural decision gets a short record here: context,
decision, consequences. Numbered, never edited after acceptance; a later ADR
supersedes an earlier one.

| #    | Title                                                         | Status   |
| ---- | ------------------------------------------------------------- | -------- |
| 0001 | Fastify API next to Next.js                                   | accepted |
| 0002 | Web Crypto in a worker instead of libsodium                   | accepted |
| 0003 | Scrypt for low-entropy secrets, SHA-256 for session tokens    | accepted |
| 0004 | Service worker bundled with esbuild, not a Next plugin        | accepted |
| 0005 | Nonce-based CSP over static caching of the landing page       | accepted |
| 0006 | Page transitions with React ViewTransition and a CSS fallback | accepted |
| 0007 | Postgres-backed rate limits and cron-triggered jobs           | accepted |
| 0008 | Recovery code kept wrapped under the master key               | accepted |
