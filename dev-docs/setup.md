# Setup

## Start with one model provider

Requires Node.js 22+. From the repository root:

```bash
npm install
cp .env.example .env
```

Edit `.env` using one provider:

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-key
MODEL=gpt-5.6-sol
```

Or use OpenRouter, without an OpenAI key:

```dotenv
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
MODEL=openai/gpt-5.6-sol
```

Select an available model in your provider account. Restart after changing configuration. See [model switching](model-switching.md) for precedence and legacy provider prefixes.

```bash
npm run dev:web
```

`npm run dev` is an alias for the web app. Open `http://127.0.0.1:3100` or `http://localhost:3100`. The web follow-up approval server is loopback-only by default because it can use local Ambiguous credentials.

## Add one useful capability

Choose the tools your app needs, then follow [using-sponsor-tools.md](../using-sponsor-tools.md) for authentication, configuration, and a first call. Each integration has its own prerequisites.

## Verify offline, then prove the live path

```bash
npm run verify
```

This needs no `.env` and makes no live sponsor calls. It checks retained workspace types and offline tests. Each app reports missing provider or surface credentials when the relevant integration is used; demonstrate an actual reply and the sponsor result you plan to show. [Demo prompts](demo-prompts.md)
