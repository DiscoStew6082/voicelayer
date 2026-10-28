# Surface map

VoiceLayer keeps the runnable template app under `apps/web`. The voice route lives inside the web app. Remote MCP tools, such as Ambiguous AI, are connected through the shared agent factory when configured.

| Surface | Agent and context | UI and actions | Optional capabilities | Limits |
|---|---|---|---|---|
| Web | `makeAgent`; selected sample incident, timeline and Ambiguous follow-ups via `useAgentContext` | Incident cards, timeline, approval UI; `select_incident`, `propose_followup`, `retrieve_followup`, `refresh_followups` | Ambiguous through the server-side approval boundary | Web chat does not register Exa search or raw workplace write tools; approval server is loopback-only by default |
| Voice (`/voice`) | Separate `RealtimeAgent`; shares system prompt | Spoken conversation and transcript | Exa via server search route | OpenAI Realtime key required regardless of chat provider; no incident workspace context, workplace MCP, or approval tools |

The web template has its own Ambiguous approval boundary for follow-up tasks; other surfaces that expose Ambiguous MCP should use an isolated demo workspace and enforce required write approval in their own code.

## Launch commands

Run these from the repository root after [setup](setup.md):

| Surface | Command | Next step |
|---|---|---|
| Web | `npm run dev:web` | Open `http://localhost:3100` |
| Voice | `npm run dev:web` | Set `OPENAI_API_KEY`, then open `http://localhost:3100/voice` and allow microphone access |

`npm run verify` covers the root workspaces without credentials.