# Deploy

`apps/web` is an ordinary Next.js app and deploys to Vercel or any Node host.

## Requirements

- Node.js 22+ (global `WebSocket`)
- Environment variables provided through the platform's secret management — root `.env` is a local convention only

## Health checks

Liveness and readiness are different signals:

- **Liveness** — the process and event loop are running
- **Readiness** — the runtime reports its configured providers as available

The app reports missing selected-provider or surface configuration when used, so a broken deploy fails loudly when exercised instead of serving as an agent that never answers.

## Scaling

Run **one app instance for this demo**. Proposal approval
buttons use process-local inline handlers. Before scaling, implement shared
persistent action bindings and reconstructible registered-component handlers.

## Secrets

Server-side only. Never log credentials, provider tokens, or raw payloads. Log
startup status, status transitions, tool errors with
idempotency ids, and event/turn ids for correlation — never message
bodies or files.