# 0005 – Nonce-based CSP over static caching of the landing page

**Status:** accepted · 2026-10-13

## Context

The PRD wants a strict CSP with nonces (12.4) and a statically rendered landing
page served from a CDN (section 5). A nonce is unique per response, so a
statically cached page cannot carry one.

## Decision

Strict CSP with per-request nonces for every page (`proxy.ts`). Pages render on
the Node server; the landing page has no data dependencies and renders in a few
milliseconds. Fonts, icons and hashed assets are cached immutably.

## Consequences

- `script-src 'self' 'nonce-…' 'strict-dynamic'`, no `unsafe-inline` for
  scripts. Styles allow `unsafe-inline` because the editor and the view
  transition runtime set inline style attributes.
- Subresource Integrity for bundles is not provided by Next with Turbopack; the
  build id is published on `/changelog` and in Settings → About instead, and SRI
  stays on the list for the native app milestone.
