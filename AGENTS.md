# Notes for coding agents

Read [hackathon-overview.md](hackathon-overview.md), [hackathon-rules.md](hackathon-rules.md), and [using-sponsor-tools.md](using-sponsor-tools.md), then the app README in `apps/web`. The incident app is infrastructure reference code.

VoiceLayer is the web template adapted; the Slack and React Native template apps were removed as unused.

For setup, follow [CopilotKit onboarding](README.md#copilotkit-onboarding). Explain the model-only and Intelligence options before starting the official `onboard start` workflow. Preserve the app and its working behavior; do not scaffold over this checkout. Use current CLI instructions instead of copying authentication and provisioning steps from memory.

Hard-won rules that are easy to get wrong here:

- **`@ag-ui/client` must stay deduped.** The root `package.json` pins it via
  `overrides` to the exact version `@copilotkit/runtime` declares. Two copies
  produce two `AbstractAgent` types and agent creation fails
  on a private `_debug` property. If you bump `@copilotkit/runtime`, re-check
  `npm ls @ag-ui/client` and update the override.
- **`maxSteps` defaults to 1** on `BuiltInAgent`. Any agent with tools needs more,
  or it calls one tool and stops before seeing the result.
- **Do not add `identifyUser` to `CopilotRuntime`.** It belongs on a Channels
  runtime, which this checkout does not use.
- **Never invent a component or prop.** The vocabulary is fixed by the
  CopilotKit packages in use.
- Run `npm run typecheck` before claiming anything works.