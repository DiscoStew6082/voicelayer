# A complete incident demo

The point is to show work informed by its surroundings and a result visible where the interaction began. These are reference interactions to learn from. Build your own project and its core functionality during the event, and distinguish that work from inherited starter code. See [build eligibility](../SUBMISSION.md#build-eligibility).

## Browser: ambient context and approved workplace actions

```bash
npm run dev:web
```

Open `http://localhost:3100` and select an incident. Try:

> What is happening with the selected incident? Show an incident card and a timeline.

> Propose a follow-up for this incident to investigate the retry spike. Show me the exact task before it is saved.

> Select the other incident and tell me what changed.

Expected: `incident_card`, `timeline`, `propose_followup`, `retrieve_followup`, `refresh_followups`, and `select_incident` as appropriate. The context is derived from the displayed sample data and the Ambiguous records retrieved for the selected incident. The agent prepares a proposal; the page approval button performs the write. Web chat does not register Exa search.

### Add a persistent workplace record

With Ambiguous AI configured, follow [the web app flow](../apps/web/README.md#try-the-flow): propose an exact task in your demo workspace, approve it with the page button, and open the returned record link if Ambiguous provides one. Refresh the page and retrieve the same ID.

## Record a focused video

1. Show the surface and existing context.
2. Ask a question that relies on that context.
3. Show the assessment and one complete action or returned research result.
4. Open the actual record or source link.
5. Explain what the surrounding context made possible.

State what is sample data, what changed locally, and what reached a real service. See [SUBMISSION.md](../SUBMISSION.md) for the event checklist.

Before recording, use the [four-criterion evidence checklist](../SUBMISSION.md#evidence-for-the-judging-criteria). Show your original interaction, one verified outcome, appropriate user control, and a relevant failure or cancellation case. Sponsor usage should explain how the result became possible.