# Using sponsor tools

One setup reference for the sponsors this project uses. **OpenAI** is the primary provider; **CopilotKit and OpenRouter** provide the agent runtime and alternate model gateway; **Exa and Ambiguous AI** provide additional capabilities. This started from the Agents, Everywhere hackathon kit; the [global event page](https://aitinkerers.org/hackathons/global/agents-everywhere) maintains the full event roster.

Use Node.js 22+. Run the homepage's clone/install steps and keep credentials in root `.env`. Never put keys in frontend code or a submission. `npm run verify` covers offline behavior, not live account access.

| Sponsor | Used by | First result |
|---|---|---|
| [OpenAI](#openai) | Web app, voice route | A model response to supplied context |
| [CopilotKit](#copilotkit) | Web app | A contextual answer and rendered UI |
| [OpenRouter](#openrouter) | Optional model gateway | A response from your chosen catalog model |
| [Exa](#exa) | Voice search route | Research with inspectable sources |
| [Ambiguous AI](#ambiguous-ai) | Web app | A real workplace record that survives refresh |

## OpenAI

**Access and authentication.** Create a server-side [API key](https://platform.openai.com/api-keys) in the OpenAI organization/project you will use.

**Configure** in root `.env`:

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-key
MODEL=gpt-5.6-sol
```

`MODEL` is the kit's configured model; choose one available to your API account.

**First call.** From root, make a small Responses API request using the configured key and model:

```bash
node --env-file=.env --input-type=module <<'JS'
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.MODEL,
    input: 'A team already tried a rollback and it did not help. What should an assistant remember when suggesting the next step?',
    max_output_tokens: 1024,
  }),
});
if (!response.ok) throw new Error(`OpenAI request failed: HTTP ${response.status}`);
const result = await response.json();
const answer = result.output.flatMap(item => item.content ?? [])
  .filter(item => item.type === 'output_text').map(item => item.text).join('\n');
if (!answer) throw new Error(`OpenAI returned no text; response status: ${result.status}`);
console.log(answer);
JS
```

**Check:** the response accounts for the failed rollback; confirm usage in the correct API project. Then run `npm run dev:web`. These use the [shared model adapter](packages/agent-core/src/model.ts). [Agents SDK quickstart](https://openai.github.io/openai-agents-js/guides/quickstart/)

## CopilotKit

**Access and authentication.** The web app needs only your model-provider account for CopilotKit's existing integration. To connect it to Intelligence, use the [official onboarding prompt](README.md#copilotkit-onboarding).

**First call, React web:** run `npm run dev:web`, open `http://localhost:3100`, select an incident, then ask: "What is happening with the selected incident? Show a card." **Check:** the answer matches the current page without pasting its contents. [AppControl](apps/web/src/components/app-control.tsx) registers page context and frontend tools; [GenerativeUI](apps/web/src/components/generative-ui.tsx) registers React components. With Ambiguous configured, ask for a follow-up proposal, approve it in the page, then refresh and read back the same provider record.

Keep the `@ag-ui/client` override. [CopilotKit docs](https://docs.copilotkit.ai/)

## OpenRouter

**Access and authentication.** Create an [API key](https://openrouter.ai/keys) and choose a model from the [catalog](https://openrouter.ai/models). Use a model that supports tools for the web app.

**Configure** root `.env`:

```dotenv
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
MODEL=openai/gpt-5.6-sol
```

Replace `MODEL` with an available catalog slug. OpenRouter chat does not need an OpenAI key. The independent browser voice route still requires OpenAI Realtime credentials.

**First call:**

```bash
node --env-file=.env --input-type=module <<'JS'
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.MODEL,
    messages: [{ role: 'user', content: 'Suggest one useful action for an assistant in a team research thread.' }],
  }),
});
if (!response.ok) throw new Error(`OpenRouter request failed: HTTP ${response.status}`);
const result = await response.json();
console.log(result.choices[0].message.content);
JS
```

**Check:** inspect the response and selected model in your account, then run the same template scenario after restarting the app. [Quickstart](https://openrouter.ai/docs/quickstart) · [Provider precedence and switching](dev-docs/model-switching.md)

## Exa

**Access and authentication.** Create an [Exa API key](https://dashboard.exa.ai/api-keys). Exa supplies public web evidence; it does not read your private incident logs.

**Configure** root `.env`:

```dotenv
EXA_API_KEY=your-key
EXA_SEARCH_TYPE=fast
```

**First call**, using the same SDK as the kit:

```bash
node --env-file=.env --input-type=module <<'JS'
import { Exa } from 'exa-js';
const exa = new Exa(process.env.EXA_API_KEY);
const result = await exa.searchAndContents('documented causes of retry storms', {
  type: 'fast',
  numResults: 3,
  highlights: { numSentences: 2, highlightsPerUrl: 1 },
});
console.log(result.results.map(({ title, url, highlights }) => ({ title, url, highlights })));
JS
```

**Check:** open the returned URLs and compare their evidence with the answer. The [search capability](packages/agent-core/src/capabilities/search.ts) appears in the voice search route; ordinary web chat does not register Exa. [Search API quickstart](https://exa.ai/docs/reference/search-api-guide)

## Ambiguous AI

**Access and authentication.** Open [Ambiguous AI](https://www.ambiguous.ai/) and choose a demo workspace you control. Use that workspace's **Connect** instructions and obtain an API key with the task read/write permissions you need. The kit sends this key as a Bearer credential to `https://app.ambiguous.ai/mcp`. Its environment name is specific to this kit; the vendor CLI manages credentials separately. [Authentication guide](https://www.ambiguous.ai/auth.md) · [MCP guide](https://www.ambiguous.ai/agents/mcp)

**Configure** root `.env`:

```dotenv
AMBIGUOUS_API_KEY=your-workspace-api-key
```

**First call:** confirm the credential's identity before creating data:

```bash
node --env-file=.env --input-type=module <<'JS'
const response = await fetch('https://app.ambiguous.ai/api/users/me', {
  headers: { Authorization: `Bearer ${process.env.AMBIGUOUS_API_KEY}` },
});
if (!response.ok) throw new Error(`Ambiguous identity check failed: HTTP ${response.status}`);
console.log(await response.json());
JS
```

**Check:** the returned identity belongs to the intended demo workspace. Then run `npm run dev:web` and follow [the web template's create/read-back sequence](apps/web/README.md#try-the-flow). Ask for the exact proposed task, approve it with the page button, and retrieve the same ID after refreshing. Open the actual returned record link. The web chat proposes and reads through frontend tools; it does not receive raw Ambiguous write tools.

The [shared MCP connection](packages/agent-core/src/capabilities/workplace.ts) can also serve other surfaces when configured. Tool schemas come from the live workspace; never invent names, arguments, or record URLs. Approval prompts and cards guide behavior but do not enforce a gate around every MCP tool. For your own app, enforce required authorization at the write boundary. A `401` needs valid credentials; a `403` needs appropriate permissions. A new workspace does not fix access to the intended one.

[Developer guide](https://www.ambiguous.ai/llms.txt) · [API schemas](https://app.ambiguous.ai/api/openapi.json) · [Task-only disposable sandbox](https://www.ambiguous.ai/sandbox.md) (separate credentials, no MCP)
