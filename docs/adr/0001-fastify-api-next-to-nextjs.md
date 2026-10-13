# 0001 – Fastify API next to Next.js

**Status:** accepted · 2026-10-13

## Context

Next.js could serve the whole product through route handlers and server
actions. The PRD plans a native iOS client on the same API (section 15) and
wants rules, moderation and background jobs to live in one place that is not
tied to a rendering framework.

## Decision

The API is a separate Fastify 5 service (`apps/api`) with its own deployment,
schema and tests. The browser never talks to it: Next.js (`apps/web`) calls it
over Railway private networking with a shared internal token, and server
actions are the only mutation path from the client.

## Consequences

- Rules are enforced once, in the API and in the database (triggers for room
  kinds), regardless of which client calls.
- The web service stays thin: rendering, sessions, cookies, the local crypto and
  offline layer.
- Two services to deploy and monitor instead of one; `turbo` and a shared
  package keep types and error codes in sync.
