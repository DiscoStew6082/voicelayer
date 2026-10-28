# Troubleshooting

Ordered by how often each one wastes an afternoon. Every entry here has already
cost somebody real time.

## OpenRouter-only setup asks for an OpenAI key

Set `MODEL_PROVIDER=openrouter` and `OPENROUTER_API_KEY` in root `.env`, choose an
available `MODEL` slug, and restart. The app reports missing selected
chat-provider configuration when the agent is used. `/voice` separately needs OpenAI Realtime credentials. See
[model switching](model-switching.md).

## Verification versus configured startup

`npm run verify` needs no `.env` or live credentials. The relevant app path
reports missing selected-provider or surface configuration when used, without
authenticating against remote services. A successful offline check does not prove live access.

## It will not compile

**`separate declarations of a private property '_debug'`** — two copies of
`@ag-ui/client`. The root `package.json` pins it via `overrides`; check it still
matches what the runtime declares:

```bash
npm ls @ag-ui/client     # every line should read the same version
```

**`TS1309: The current file is a CommonJS module`** — `"type": "module"` is
missing from that package.json. The startup code uses top-level `await`.

## The agent calls one tool and then gives up

`maxSteps` defaults to **1** on `BuiltInAgent`. The kit sets 10 in
`packages/agent-core/src/agent.ts`.

## `AI SDK Warning: System messages in the prompt or messages fields…`

Harmless and not yours. `BuiltInAgent`'s `prompt` option becomes a system message
in the messages array, and the AI SDK warns about that pattern generically. It
does not mean your prompt is being injected.

## `npm install` fails with "Cannot read properties of null (reading 'edgesOut')"

You added **vitest**. `@copilotkit/channels` declares `vitest: ^4.0.0` as a peer
dependency, and npm's dependency resolver crashes trying to reconcile that with
vitest as a direct dependency — at the root _or_ in a workspace, and from a
completely clean `node_modules`. The error names nothing useful.

That is why this kit tests with **`node:test`**, Node's built-in runner: no
install, no peer conflict, and `mock.fn()` covers what `vi.fn()` was doing.

```bash
npm test          # node --import tsx --test 'src/**/*.test.tsx'
```

If you genuinely need vitest, `--legacy-peer-deps` gets you past it — put it in
`.npmrc` so it applies to every install, not just the one you remember.

## Still stuck

- `npm run verify` — workspace typechecks and offline tests
- The canonical, never-stale setup workflow: <https://copilotkit.ai/channels-guide.md>

## A web follow-up does not appear after refresh

Only approved Ambiguous records should survive refresh. First confirm `AMBIGUOUS_API_KEY` is set, restart `npm run dev:web`, prepare a proposal, and click **Approve & save to Ambiguous** on the page. Then refresh and use the returned record ID or **Refresh from Ambiguous**. If the provider returns no retrievable record, the persistence check has not passed. See [the web app](../apps/web/README.md#try-the-flow).