# VoiceLayer: accessible voice control inside your web app

**OpenAI Realtime + CopilotKit React**

VoiceLayer keeps the normal application visible while voice runs as another
input method. The OpenAI Realtime agent receives live semantic page context and
invokes the same application-owned actions exposed to CopilotKit. It can select
records, scroll, fill fields, go back, and request a submission. Consequential
actions pause for explicit confirmation. A compact transcript remains available
for debugging and judging.

The hackathon prototype uses fictional incidents and keeps submitted follow-ups
in browser memory. It does not write to an external workplace provider, control
other websites, or simulate operating-system pointer input.

## Run locally

Requirements:

- Node.js 22 or newer
- An OpenAI API key with Realtime API access
- Microphone permission in the browser

From the repository root:

```bash
npm ci
```

Create a root `.env` file:

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-key
MODEL=gpt-5.6-sol
```

The server exchanges `OPENAI_API_KEY` for a short-lived Realtime client secret;
the long-lived key is never sent to the browser. Optional settings are
`NEXT_PUBLIC_REALTIME_MODEL` and `NEXT_PUBLIC_REALTIME_VOICE`.

Start the app:

```bash
npm run dev:web
```

Open <http://127.0.0.1:3100>.

## Run the 60-second voice demo

1. Turn on the floating voice control and allow microphone access.
2. Say “Open the second incident.”
3. Say “Fill the title with Check notification backlog.”
4. Say “Fill the details with Confirm the queue is drained by 10:30.”
5. Say “Send it.” The agent must pause for confirmation.
6. Say “Confirm.” Verify the follow-up appears under “Submitted in this
   session.”
7. Expand the transcript to show the requests and semantic tool calls.

Also try “show available incidents,” “open the details,” “show the timeline,”
“scroll down,” “select the second one,” “go back,” and “cancel” at the
confirmation step.

## Architecture

The normal CopilotKit agent and the Realtime voice agent remain separate model
sessions, but they share the application-owned `AppActions` interface:

1. The page owns selection, draft, scroll, navigation, and session submissions.
2. `AppControl` publishes live state with `useAgentContext` and registers
   CopilotKit frontend tools with `useFrontendTool`.
3. `VoiceControl` creates a RealtimeAgent over WebRTC and wraps the same actions
   as Realtime tools.
4. The Realtime SDK approval lifecycle blocks `submit_followup` until the user
   says “confirm” or presses Approve.

No agent manipulates DOM coordinates. The semantic application methods are the
enforcement and reuse boundary.

## Key files

| Responsibility | File |
| --- | --- |
| Visible workspace and application state | `src/app/page.tsx` |
| Shared semantic action types | `src/lib/app-actions.ts` |
| CopilotKit context and frontend tools | `src/components/app-control.tsx` |
| Realtime voice session, tools, approval, transcript | `src/components/voice-control.tsx` |
| Visible confirmation and session submissions | `src/components/demo-followups.tsx` |
| Ephemeral Realtime credential route | `src/app/api/realtime-token/route.ts` |
| Short voice-agent instructions | `../../packages/agent-core/src/prompt.ts` |

## Verify

From the repository root:

```bash
npm run verify
npm run build --workspace web
```

Automated checks do not exercise microphone hardware or a live Realtime
session. Before recording, run the complete spoken workflow and cancellation
path in the target browser.
