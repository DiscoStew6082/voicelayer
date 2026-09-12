# VoiceLayer submission package

Atlanta portal: <https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc>

Submission deadline: **September 12, 2026 at 4:30 PM EDT**. Aim to submit by
4:00 PM.

## Portal copy

### Project title

VoiceLayer

### Short description

VoiceLayer makes voice a first-class accessibility input for existing web
applications. An OpenAI Realtime agent receives live CopilotKit page context
and invokes semantic application actions while the normal interface remains
visible. A user who has difficulty operating a keyboard, mouse, or touchscreen
can navigate records, scroll, fill forms, and submit work with explicit
confirmation and a visible transcript.

### What makes it useful

Conventional voice assistants move the user into a separate conversation and
lose the interface they were working in. VoiceLayer operates the application
the user is already looking at. It understands the selected record, ordered
visible items, focused field, form values, and scroll state, then calls
application-owned actions instead of guessing pointer coordinates.

### Sponsor technologies used

- **OpenAI:** RealtimeAgent and WebRTC provide low-latency spoken interaction,
  tool calling, and the approval lifecycle.
- **CopilotKit:** `useAgentContext` exposes live application state and
  `useFrontendTool` exposes the same semantic action layer to the normal web
  agent.

Do not claim Ambiguous AI in the submission: this focused voice prototype keeps
submitted demo follow-ups in browser memory.

## Eligibility disclosure

### Inherited from the starter kit

- CopilotKit Agents Everywhere starter repository and incident sample data
- Existing CopilotKit web runtime, chat UI, and page-agent integration
- Existing OpenAI RealtimeAgent/WebRTC voice route and session scaffolding

### Built during the hackathon

- Floating in-app voice control that leaves the application visible
- Shared semantic `AppActions` layer used by voice and CopilotKit frontend tools
- Live context bridge for selection, visible ordering, focus, forms, and scroll
- Realtime tools for contextual selection, scrolling, form filling, and back
- Explicit approval gate for submission plus cancel behavior
- Compact status, action feedback, transcript, and guided accessibility demo
- Dark, accessibility-oriented presentation and voice-session lifecycle fixes

## Two-minute video script

**0:00–0:15 — Problem**

“Voice interfaces usually replace the screen. VoiceLayer keeps the application
visible and makes speech another accessible input method.” Show the workspace
and floating microphone.

**0:15–0:35 — Contextual navigation**

Start voice and say, “Show available incidents.” The visible list opens. Then
say, “Select the second one,” and point out that the incident changes in the
existing interface. Say, “Open the details,” then “Scroll down.”

**0:35–1:10 — Semantic form control**

Say, “Fill the title with Check notification backlog,” followed by, “Fill the
details with Confirm the queue is drained by 10:30.” Show the visible fields
update in place.

**1:10–1:35 — Human control**

Say, “Send it.” Show that nothing is submitted yet. Say, “Confirm.” Show the
new follow-up in “Submitted in this session.” Mention that this is fictional,
browser-session data.

**1:35–1:55 — Technical proof**

Expand the transcript. Say: “OpenAI Realtime handles speech and tool calling;
CopilotKit supplies live page context and frontend-tool integration. Both use
application-owned semantic actions, not mouse coordinates.”

**1:55–2:00 — Close**

“Keep the interface visible. Speak intent. Operate the app.”

## Social post draft

> We built VoiceLayer at Agents, Everywhere Atlanta: an accessibility-focused
> voice control layer that keeps the web app visible while an OpenAI Realtime
> agent operates it through semantic CopilotKit actions. Users can navigate,
> scroll, fill forms, and submit with explicit confirmation—no simulated mouse
> coordinates. <https://github.com/DiscoStew6082/voicelayer> [DEMO_VIDEO_URL]
>
> Built with OpenAI and CopilotKit. [ADD THE EXACT EVENT AND SPONSOR HANDLES
> REQUIRED BY THE ATLANTA ORGANIZERS]

## Final checklist

- [x] Project-specific title and description prepared
- [x] Inherited starter work and hackathon work identified separately
- [x] Complete voice workflow and cancellation/confirmation behavior implemented
- [x] Sample data and browser-session persistence clearly labeled
- [x] Run final verification and production build (3 typechecks, 37 tests, build)
- [x] Create a participant-owned public GitHub repository
- [ ] Confirm `.env` and secrets are absent from the public repository
- [ ] Record and upload a video no longer than two minutes
- [ ] Add repository and video URLs to the social post
- [ ] Confirm the exact Atlanta event/sponsor social handles with organizers
- [ ] Publish the social post
- [ ] Sign in and submit through the Atlanta portal before 4:30 PM EDT
