# 0008 – Recovery code kept wrapped under the master key

**Status:** accepted · 2026-10-13

## Context

Settings → Security must show the 12-word code again after a fresh sign-in
(PRD 7.7). The master key is non-extractable, so the words cannot be derived
back from it.

## Decision

At setup the seed is imported as an AES-GCM key and wrapped with the master key
(AES-KW); the wrapped bytes sit next to the master key in IndexedDB. Revealing
unwraps them inside the worker and re-encodes the 12 words. The UI requires a
fresh e-mail code (`/auth/reauth/*`) before calling it.

## Consequences

- Same protection level as content keys: without the non-extractable master
  key the wrapped seed is opaque.
- Clearing site data removes both; the person needs their saved code, as the
  onboarding explains.
