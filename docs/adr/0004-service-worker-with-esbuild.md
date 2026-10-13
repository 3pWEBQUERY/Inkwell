# 0004 – Service worker bundled with esbuild, not a Next plugin

**Status:** accepted · 2026-10-13

## Context

Next 16 builds with Turbopack by default. Plugin-based service worker
integrations are coupled to the bundler and have lagged behind bundler
changes before.

## Decision

`sw.ts` uses the Serwist runtime library and is bundled by a 40-line esbuild
script (`scripts/build-sw.mjs`) in `prebuild`. The precache manifest lists the
files in `public/` with content hashes plus the shell routes with the build id.

## Consequences

- The build does not depend on bundler internals; Turbopack and Webpack both
  work.
- Hashed `_next/static` assets are not precached but cached on first use
  (cache-first, immutable). The shell is fully cached after the first visit,
  which matches the PRD's offline promise.
