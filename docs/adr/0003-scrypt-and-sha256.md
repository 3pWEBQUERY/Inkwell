# 0003 – Scrypt for low-entropy secrets, SHA-256 for session tokens

**Status:** accepted · 2026-10-13

## Context

The PRD asks for sessions hashed with scrypt. Scrypt per request costs tens of
milliseconds and would be paid on every API call.

## Decision

- Six-digit sign-in codes (low entropy) are stored with scrypt (N=2^15) and
  limited to five attempts in ten minutes.
- Session tokens are 256-bit random values; the database holds their SHA-256.
  A leaked hash table is useless without the original token, and lookups stay
  fast.

## Consequences

- The intent of the PRD (no usable secrets at rest) is met for both cases.
- Sign-in costs one scrypt verification; everything else is a hash lookup.
