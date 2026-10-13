# 0002 – Web Crypto in a worker instead of libsodium

**Status:** accepted · 2026-10-13

## Context

Private entries are encrypted in the browser. Options: libsodium (WASM, ~200 kB,
battle-tested) or the platform's Web Crypto API.

## Decision

Web Crypto, inside a dedicated worker (`workers/crypto.worker.ts`):

- 128-bit seed shown as 12 BIP39 words → HKDF-SHA-256 → AES-KW master key,
  stored as a non-extractable `CryptoKey` in IndexedDB.
- One AES-256-GCM content key per entry, wrapped by the master key.
- Key rotation re-wraps content keys; texts are never re-encrypted.

## Consequences

- No WASM download; the key material is not readable by page scripts.
- A compromised server still delivers the code that encrypts (PRD 11.2). The
  privacy policy states this; CSP with nonces and the published build id in the
  changelog are the mitigations until the native app.
- AES-KW needs the wrapped key to be extractable at generation time; it is
  generated inside the worker and never leaves it unwrapped.
