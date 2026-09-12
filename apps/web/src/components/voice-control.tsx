"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  tool,
  type RealtimeItem,
} from "@openai/agents/realtime";
import { ACCESSIBILITY_VOICE_PROMPT } from "agent-core/shared";
import { z } from "zod";
import type { AppActions, FollowupDraft } from "@/lib/app-actions";
import { REALTIME_MODEL } from "@/lib/realtime-config";
import { confirmationDecision } from "@/lib/voice-confirmation";

type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "working"
  | "speaking"
  | "confirming"
  | "error";

type TranscriptEntry = {
  id: string;
  speaker: "You" | "Agent" | "Action";
  text: string;
};

type ApprovalItem = Parameters<RealtimeSession["approve"]>[0];

type PendingApproval = {
  item: ApprovalItem;
  draft: FollowupDraft;
  baselineUserItemId: string | null;
};

function messageText(item: RealtimeItem) {
  if (item.type !== "message") return "";
  return item.content
    .map((part) =>
      "transcript" in part
        ? (part.transcript ?? "")
        : "text" in part
          ? part.text
          : "",
    )
    .join(" ")
    .trim();
}

function latestCompletedUserMessage(history: RealtimeItem[]) {
  return [...history]
    .reverse()
    .find(
      (item) =>
        item.type === "message" &&
        item.role === "user" &&
        item.status === "completed" &&
        Boolean(messageText(item)),
    );
}

export function VoiceControl({ actions }: { actions: AppActions }) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [pendingApproval, setPendingApproval] =
    useState<PendingApproval | null>(null);
  const actionsRef = useRef(actions);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const pendingApprovalRef = useRef<PendingApproval | null>(null);
  const audioPlayingRef = useRef(false);
  const transcriptLogRef = useRef<HTMLDivElement | null>(null);
  actionsRef.current = actions;

  useEffect(() => {
    const log = transcriptLogRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [transcript]);

  const settleApproval = useCallback(
    async (decision: "approve" | "reject") => {
      const pending = pendingApprovalRef.current;
      const session = sessionRef.current;
      if (!pending || !session) return;
      pendingApprovalRef.current = null;
      setPendingApproval(null);
      setStatus("working");
      try {
        // A spoken approval also starts a normal Realtime response. Cancel that
        // competing response before resuming the SDK's pending tool call.
        session.interrupt();
        if (decision === "approve") {
          await session.approve(pending.item);
        } else {
          await session.reject(pending.item, {
            message: "The user cancelled the submission. Confirm that nothing was submitted.",
          });
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus("error");
      }
    },
    [],
  );

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError("");
    setLastAction("");

    const readAppContext = tool({
      name: "read_app_context",
      description:
        "Read the live semantic state of the visible application. Call before resolving contextual words, positions, newest items, focus, form values, or scroll state.",
      parameters: z.object({}),
      execute: async () => JSON.stringify(actionsRef.current.readContext()),
    });

    const ignoreNonCommand = tool({
      name: "ignore_non_command",
      description:
        "Use only when the audio is background speech, a conversational fragment, or not a clear request to operate this application. This tool never changes the UI.",
      parameters: z.object({}),
      execute: async () => "No application command was detected; nothing changed.",
    });

    const openIncident = tool({
      name: "open_incident",
      description:
        "Open an incident by ID after choosing it from read_app_context. This changes the visible selection.",
      parameters: z.object({ incidentId: z.string() }),
      execute: async ({ incidentId }) =>
        actionsRef.current.openIncident(incidentId),
    });

    const showIncidentList = tool({
      name: "show_incident_list",
      description:
        "Visibly open the application's incident list so the user can inspect every available incident. Use for commands like 'show available incidents', 'open the incident menu', or 'what incidents can I choose from?'.",
      parameters: z.object({}),
      execute: async () => actionsRef.current.showIncidentList(),
    });

    const setIncidentDetails = tool({
      name: "set_incident_details",
      description:
        "Visibly open or close the selected incident's details and timeline. Use expanded true for 'open/show details' or 'show the timeline', and false for 'close/hide details'.",
      parameters: z.object({ expanded: z.boolean() }),
      execute: async ({ expanded }) =>
        actionsRef.current.setIncidentDetails(expanded),
    });

    const selectVisibleItem = tool({
      name: "select_visible_item",
      description:
        "Immediately select a currently visible incident by one-based position. Use this directly for commands like 'open the second incident' or 'select the second one'; position 2 means the second item. The frontend resolves the live ordered list, so a prior context call is unnecessary.",
      parameters: z.object({ position: z.number().int().min(1) }),
      execute: async ({ position }) =>
        actionsRef.current.openIncidentAt(position),
    });

    const scrollPage = tool({
      name: "scroll_page",
      description:
        "Scroll the visible application by one comfortable viewport step. This is a semantic page action, not coordinate control.",
      parameters: z.object({ direction: z.enum(["up", "down"]) }),
      execute: async ({ direction }) =>
        actionsRef.current.scrollPage(direction),
    });

    const setFollowupField = tool({
      name: "set_followup_field",
      description:
        "Put text into a visible follow-up form field. Use the live context to resolve which field 'that' refers to.",
      parameters: z.object({
        field: z.enum(["title", "details"]),
        value: z.string().max(4000),
      }),
      execute: async ({ field, value }) =>
        actionsRef.current.setFollowupField(field, value),
    });

    const goBack = tool({
      name: "go_back",
      description:
        "Return to the previously selected item inside this application. Does not control browser or operating-system history.",
      parameters: z.object({}),
      execute: async () => actionsRef.current.goBack(),
    });

    const submitFollowup = tool({
      name: "submit_followup",
      description:
        "Consequential session-only action: submit the currently visible follow-up to the on-screen list. Copy the selected incident and exact visible field values from read_app_context. The application requires explicit approval before execution.",
      parameters: z.object({
        incidentId: z.string(),
        title: z.string().trim().min(1).max(200),
        details: z.string().trim().min(1).max(4000),
      }),
      needsApproval: true,
      execute: async (draft) => {
        const context = actionsRef.current.readContext();
        const selectedId = String(context.selectedIncident.id ?? "");
        if (
          selectedId !== draft.incidentId ||
          context.followupForm.title !== draft.title ||
          context.followupForm.details !== draft.details
        ) {
          return "The visible selection or draft changed. Read app context again and do not submit stale values.";
        }
        const submitted = await actionsRef.current.submitApprovedFollowup(draft);
        return `Saved ${submitted.title} for this browser session.`;
      },
    });

    const agent = new RealtimeAgent({
      name: "In-app voice control",
      instructions: ACCESSIBILITY_VOICE_PROMPT,
      tools: [
        readAppContext,
        ignoreNonCommand,
        showIncidentList,
        setIncidentDetails,
        openIncident,
        selectVisibleItem,
        scrollPage,
        setFollowupField,
        goBack,
        submitFollowup,
      ],
    });

    const session = new RealtimeSession(agent, {
      transport: "webrtc",
      model: REALTIME_MODEL,
      config: {
        // Keep the SDK's complete tool lifecycle intact: after a function
        // result it automatically creates a follow-up response so the agent
        // can briefly confirm the completed action. `required` also applies to
        // that follow-up and can trap the session in another tool call.
        toolChoice: "auto",
        audio: {
          input: {
            // The hackathon demo normally runs through a laptop microphone in
            // a shared room. Filter the audio before both VAD and the model,
            // then require a stronger nearby signal before starting a turn so
            // surrounding conversations are less likely to become commands.
            noiseReduction: { type: "far_field" },
            transcription: {
              model: "gpt-4o-mini-transcribe",
              language: "en",
              keywords: [
                "yes",
                "confirm",
                "approve",
                "I approve",
                "no",
                "cancel",
              ],
              prompt:
                "This is an application voice-control session. Preserve short approval replies exactly, especially: yes, confirm, I approve, no, and cancel.",
            },
            turnDetection: {
              type: "server_vad",
              threshold: 0.72,
              prefixPaddingMs: 300,
              silenceDurationMs: 650,
            },
          },
        },
      },
    });
    sessionRef.current?.close();
    sessionRef.current = session;

    session.on("history_updated", (history) => {
      if (sessionRef.current !== session) return;
      setTranscript(
        history
          .map((item) => {
            if (item.type === "function_call") {
              const result = item.output?.trim();
              return {
                id: item.itemId,
                speaker: "Action" as const,
                text: `${item.name.replaceAll("_", " ")}${result ? ` — ${result}` : ""}`,
              };
            }
            if (item.type !== "message" || item.role === "system") return null;
            const text = messageText(item);
            return text
              ? {
                  id: item.itemId,
                  speaker: item.role === "user" ? ("You" as const) : ("Agent" as const),
                  text,
                }
              : null;
          })
          .filter((entry): entry is TranscriptEntry => entry !== null),
      );

      const pending = pendingApprovalRef.current;
      const latestUser = latestCompletedUserMessage(history);
      if (
        !pending ||
        !latestUser ||
        latestUser.itemId === pending.baselineUserItemId
      )
        return;

      const decision = confirmationDecision(messageText(latestUser));
      pending.baselineUserItemId = latestUser.itemId;
      if (decision) void settleApproval(decision);
    });

    session.on("tool_approval_requested", (_context, _agent, request) => {
      if (
        sessionRef.current !== session ||
        request.type !== "function_approval"
      )
        return;
      let draft: FollowupDraft = actionsRef.current.readContext().followupForm;
      try {
        const args = JSON.parse(request.approvalItem.arguments ?? "{}") as {
          title?: string;
          details?: string;
        };
        draft = {
          title: args.title ?? draft.title,
          details: args.details ?? draft.details,
        };
      } catch {
        // The visible form remains the source shown to the user for review.
      }
      const pending = {
        item: request.approvalItem,
        draft,
        baselineUserItemId:
          latestCompletedUserMessage(session.history)?.itemId ?? null,
      };
      pendingApprovalRef.current = pending;
      setPendingApproval(pending);
      setStatus("confirming");
    });

    session.on("agent_start", () => {
      if (sessionRef.current === session) setStatus("working");
    });
    session.on("agent_end", () => {
      if (
        sessionRef.current === session &&
        !audioPlayingRef.current &&
        !pendingApprovalRef.current
      ) {
        setStatus("listening");
      }
    });
    session.on("agent_tool_end", (_context, _agent, completedTool, result) => {
      if (sessionRef.current === session && completedTool.name !== "read_app_context") {
        setLastAction(String(result).slice(0, 240));
      }
    });
    session.on("audio_start", () => {
      if (sessionRef.current === session) {
        audioPlayingRef.current = true;
        setStatus("speaking");
      }
    });
    session.on("audio_stopped", () => {
      if (sessionRef.current === session) {
        audioPlayingRef.current = false;
        setStatus(pendingApprovalRef.current ? "confirming" : "listening");
      }
    });
    session.on("audio_interrupted", () => {
      if (sessionRef.current === session) {
        audioPlayingRef.current = false;
        setStatus("working");
      }
    });
    session.on("error", (event) => {
      if (sessionRef.current !== session) return;
      session.close();
      sessionRef.current = null;
      pendingApprovalRef.current = null;
      audioPlayingRef.current = false;
      setPendingApproval(null);
      setError(String(event.error ?? event));
      setStatus("error");
    });

    try {
      const response = await fetch("/api/realtime-token", { method: "POST" });
      const data = (await response.json()) as { value?: string; error?: string };
      if (!response.ok || !data.value)
        throw new Error(data.error ?? "Could not mint a session token.");
      await session.connect({ apiKey: data.value });
      if (sessionRef.current === session) setStatus("listening");
      else session.close();
    } catch (cause) {
      session.close();
      if (sessionRef.current === session) {
        sessionRef.current = null;
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus("error");
      }
    }
  }, [settleApproval]);

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    pendingApprovalRef.current = null;
    audioPlayingRef.current = false;
    setPendingApproval(null);
    setStatus("idle");
  }, []);

  useEffect(() => disconnect, [disconnect]);

  const active = !["idle", "error"].includes(status);
  const statusLabel =
    status === "idle"
      ? "Voice control off"
      : status === "connecting"
        ? "Connecting"
        : status === "confirming"
          ? "Confirmation needed"
          : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <aside className="ck-voice-control" aria-label="Voice control">
      <div className="ck-voice-stack">
        {lastAction && (
          <p className="ck-voice-result" role="status">
            <span aria-hidden="true">✓</span>
            <span>
              <strong>Voice action completed</strong>
              {lastAction}
            </span>
          </p>
        )}

        {pendingApproval && (
          <section className="ck-voice-approval" aria-label="Confirm submission">
            <strong>Submit this follow-up?</strong>
            <span>{pendingApproval.draft.title}</span>
            <p>{pendingApproval.draft.details}</p>
            <p>Say “yes, confirm” or “no, cancel”, or use these buttons.</p>
            <div className="ck-approval-actions">
              <button
                type="button"
                className="ck-btn ck-btn--primary"
                onClick={() => void settleApproval("approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="ck-btn"
                onClick={() => void settleApproval("reject")}
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {error && (
          <p className="ck-voice-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="ck-voice-dock">
        <div className="ck-voice-bar">
          <button
            type="button"
            className={`ck-voice-button${active ? " ck-voice-button--active" : ""}`}
            onClick={active ? disconnect : connect}
            disabled={status === "connecting"}
            aria-pressed={active}
            aria-label={active ? "Turn off voice control" : "Turn on voice control"}
          >
            <span aria-hidden="true">{active ? "■" : "●"}</span>
          </button>
          <div>
            <strong>{statusLabel}</strong>
            <span aria-live="polite">
              {status === "confirming"
                ? "Say “yes, confirm” or “no, cancel”"
                : active
                  ? "Control this page by voice"
                  : "Select to start listening"}
            </span>
          </div>
        </div>

        <section className="ck-voice-transcript" aria-label="Live voice transcript">
          <header>
            <strong>Live transcript</strong>
            <span>{transcript.length} {transcript.length === 1 ? "entry" : "entries"}</span>
          </header>
          <div
            ref={transcriptLogRef}
            className="ck-voice-transcript-log"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {transcript.length ? (
              transcript.map((entry) => (
                <p key={entry.id} data-speaker={entry.speaker}>
                  <strong>{entry.speaker}</strong>
                  <span>{entry.text}</span>
                </p>
              ))
            ) : (
              <p className="ck-voice-transcript-empty">
                Spoken commands and voice actions will appear here as they happen.
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
