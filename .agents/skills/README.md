# Skills

One copy, symlinked. `.claude/skills` and `.cursor/skills` both point here, so
there is nothing to keep in sync.

Use [the onboarding path in the root README](../../README.md#copilotkit-onboarding)
for account/project setup and a verified integration. To install the current
CopilotKit development skills without starting onboarding:

```sh
npx --yes copilotkit@latest skills install -y
```

Installing skills alone does not connect the app.

`.mcp.json` at the repo root also wires the CopilotKit docs MCP server and Exa's
hosted MCP into your coding agent, so it can look things up live rather than
guessing at an API.