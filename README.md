<div align="center">

# VoiceLayer

![Agents, Everywhere hackathon — OpenAI, CopilotKit, OpenRouter, Exa, Auth0, and Ambiguous AI](assets/banner.png)

**Keep the interface visible. Speak intent. Operate the app.**

[Project](#hackathon-project-voicelayer) · [Run the demo](apps/web/) · [Submission package](SUBMISSION.md) · [Hackathon context](#overview)

</div>

## Hackathon project: VoiceLayer

VoiceLayer is an accessibility-focused voice control layer for web
applications. The interface stays visible while an OpenAI Realtime WebRTC
session listens in the background. The agent receives live CopilotKit page
context and invokes semantic application actions—selecting records, scrolling,
filling forms, navigating back, and requesting submission—without simulated
mouse coordinates. Submission is approval-gated and every interaction is
available in a compact transcript.

The demo is scoped to this application, uses fictional incident data, and keeps
submitted follow-ups in browser memory. See the [web quickstart](apps/web/) and
the [prepared submission package](SUBMISSION.md).

## Overview

Build for **[Agents, Everywhere: Bots, Channels, & More](https://aitinkerers.org/hackathons/global/agents-everywhere)**, the AI Tinkerers global hackathon on **September 12–13, 2026**. Choose your city on the event page for its local schedule. Put an agent inside a conversation, an app, a phone, or a physical environment. Make the context of that place essential to what it can do.

This project started from the Agents, Everywhere hackathon kit; the unused Slack and React Native templates have been removed. VoiceLayer is the web template, adapted.

Your project and its core functionality must be created during the event. Existing libraries, templates, and starter code are allowed; describe what you reuse and what you build. Read [the rules](hackathon-rules.md), then follow your city's participant portal for the current deadline and judging criteria.

## Get started

Use Node.js 22+, then clone and install the kit:

```bash
git clone https://github.com/DiscoStew6082/voicelayer.git
cd voicelayer
npm ci
cp .env.example .env
```

The web app uses the root install and is configured with only the credentials it needs.

Paste this into your coding agent:

```text
Read AGENTS.md, hackathon-overview.md, hackathon-rules.md, and
using-sponsor-tools.md. Help me choose one template app README for my idea,
then adapt this checkout into our own project. Ask me who it is for and
what the agent should do in that setting. Follow this README's CopilotKit
onboarding section for the selected app; keep its existing infrastructure.
Use only the integrations the idea needs. Verify a complete interaction and
prepare SUBMISSION.md, distinguishing inherited code from our event work.
```

### CopilotKit onboarding

Use the team's maintained setup prompts in the same coding-agent session, with this checkout as the project root. Choose one app first; setup should adapt that app rather than scaffold a second starter over it.

| Your starting point | Onboarding path |
|---|---|
| Web template | The existing model-provider setup runs without Intelligence. To add managed conversations with Rich Threads and other Intelligence capabilities, use the prompt below. |

**Connect the selected app to CopilotKit Intelligence:**

```text
Read AGENTS.md and the app README. Connect this app to CopilotKit
Intelligence using the current official onboarding workflow. This checkout
already has CopilotKit: preserve the existing app, agent, model provider,
tools, and approval behavior.
Generate a fresh 12-character hexadecimal run ID, substitute it for RUN_ID,
then run from the repository root:
npx --yes copilotkit@latest onboard start --run RUN_ID
Follow the instructions returned by the CLI and reuse that ID for this run.
Show the integration plan before editing, and prove the app works
before and after connecting Intelligence.
```

The [official CopilotKit prompt](https://docs.copilotkit.ai/llms.txt) serves new projects, existing apps, and existing CopilotKit integrations. The [docs home](https://docs.copilotkit.ai/) also offers **Copy Prompt**, **Open in Codex**, and **Open in Claude Code**; add the selected template's context when using those entry points. For Slack, use the [Channels onboarding path](https://docs.copilotkit.ai/slack) above. Finish one selected workflow before starting another.

Follow the CLI's returned instructions for sign-in, project selection, credentials, and verification. Keep credentials out of chat and preserve existing `.env` values. The starter reads `INTELLIGENCE_API_KEY`; if setup provisions `CPK_INTELLIGENCE_API_KEY`, map it to the variable the selected runtime actually reads. Review any required package upgrades together with the tested Channels/runtime pair and `@ag-ui/client` override. Intelligence onboarding changes the app; installing a skill or adding an API key alone does not complete that integration.

## Templates

### 1. Web — an agent inside your app

**OpenAI + CopilotKit React + Ambiguous AI**

An agent sees the page you are on and turns a request into a real workplace record you can still find after a refresh. Adapt it to customer follow-ups, a project workspace, or a personal planning app.

The included web app supplies page context, frontend tools, agent-rendered UI, and a browser approval step. Connect an Ambiguous AI workspace, then run `npm run dev:web`; approved follow-ups are saved through the server and can be read back after refresh.

**[Use the web template →](apps/web/)**

### Make the demo yours

The supplied on-call assistant is an **infrastructure example**: read ambient context, call a tool, render useful UI, and return a verifiable result. Choose a different user, problem, dataset, and interaction; the goal is your own project, not another version of the starter scenario.

Use the [demo prompts](dev-docs/demo-prompts.md) to learn how the pieces connect, then replace the sample domain. In the web follow-up flow, the page approval button saves the reviewed Ambiguous task. Enforce the same kind of write boundary around any external action you add.

Want another surface pattern? The web app also includes a voice route, and the shared agent can connect to remote MCP tools when configured. The event surfaces are inspiration, not separate tracks or a requirement to build multiple apps.

## Coding agent

Give your agent these files before it starts coding:

| File | What it provides |
|---|---|
| [hackathon-overview.md](hackathon-overview.md) | The challenge, four surfaces, and official judging criteria |
| [hackathon-rules.md](hackathon-rules.md) | Build eligibility, inherited code, and required deliverables |
| [using-sponsor-tools.md](using-sponsor-tools.md) | Every sponsor featured in this kit: access, authentication, configuration, and a first working call |
| [AGENTS.md](AGENTS.md) | Repository conventions and verification commands |

The app READMEs provide launch commands, files to customize, and a concrete result to check. Start with one template and add a second surface only if it helps your user.

## Resources

| Need | Go here |
|---|---|
| Event details, deadline, and judging | [Find your city](https://aitinkerers.org/hackathons/global/agents-everywhere), then open its participant portal and handbook |
| OpenAI agent development | [Agents SDK quickstart](https://openai.github.io/openai-agents-js/guides/quickstart/) |
| OpenRouter access and model choice | [Quickstart](https://openrouter.ai/docs/quickstart) · [Keys](https://openrouter.ai/keys) · [Model catalog](https://openrouter.ai/models) · [Model switching](dev-docs/model-switching.md) |
| CopilotKit app development | [Docs](https://docs.copilotkit.ai/) · [Discord channel for technical questions](https://discord.com/channels/1122926057641742418/1548038338848489532) |
| CopilotKit Channels | [Channels guide](https://copilotkit.ai/channels-guide.md) · [OpenTag example app](https://github.com/CopilotKit/OpenTag) |
| Exa quickstart | [Search API guide](https://exa.ai/docs/reference/search-api-guide) · [Kit setup](using-sponsor-tools.md#exa) |
| Auth0 API authorization | [Node API](https://auth0.com/docs/quickstart/backend/nodejs) · [Kit setup](using-sponsor-tools.md#auth0) |
| Ambiguous AI quickstart | [Developer guide](https://www.ambiguous.ai/llms.txt) · [Kit setup](using-sponsor-tools.md#ambiguous-ai) |
| Rehearse and debug | [Demo prompts](dev-docs/demo-prompts.md) · [Troubleshooting](dev-docs/troubleshooting.md) |
| Prepare your entry | [Submission checklist](SUBMISSION.md) |

For credit redemption instructions, choose your city on the [global event page](https://aitinkerers.org/hackathons/global/agents-everywhere) and check its participant portal's **Credits & Offers** section.

For technical questions during the event, check your city's participant portal and ask your local organizers.

`npm run verify` runs typechecks and offline tests without credentials. Each app reports missing configuration when the relevant integration is used. Live sponsor calls and platform delivery require your accounts. See [developer docs](dev-docs/README.md) for detailed setup and deployment.
