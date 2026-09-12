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

type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "working"
  | "speaking"
  | "confirming"
  | "error";

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

function confirmationDecision(text: string): "approve" | "reject" | null {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    ["confirm", "confirmed", "approve", "yes confirm", "yes approve", "go ahead", "do it"].includes(
      normalized,
    )
  )
    return "approve";
  if (
    ["cancel", "reject", "stop", "no", "do not send", "don't send"].includes(
      normalized,
    )
  )
    return "reject";
  return null;
}

export function VoiceControl({
  actions,
  nextCommand,
}: {
  actions: AppActions;
  nextCommand: string | null;
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [pendingApproval, setPendingApproval] =
    useState<PendingApproval | null>(null);
  const actionsRef = useRef(actions);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const pendingApprovalRef = useRef<PendingApproval | null>(null);
  const audioPlayingRef = useRef(false);
  actionsRef.current = actions;

  const settleApproval = useCallback(
    async (decision: "approve" | "reject") => {
      const pending = pendingApprovalRef.current;
      const session = sessionRef.current;
      if (!pending || !session) return;
      pendingApprovalRef.current = null;
      setPendingApproval(null);
      setStatus("working");
      try {
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
        "Consequential demo action: submit the currently visible follow-up to the on-screen session list. Copy the selected incident and exact visible field values from read_app_context. The application requires explicit approval before execution.",
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
        return `Submitted ${submitted.title} in the on-screen demo.`;
      },
    });

    const agent = new RealtimeAgent({
      name: "In-app voice control",
      instructions: ACCESSIBILITY_VOICE_PROMPT,
      tools: [
        readAppContext,
        ignoreNonCommand,
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
              return `tool  ${item.name}${result ? ` — ${result}` : ""}`;
            }
            if (item.type !== "message" || item.role === "system") return "";
            const text = messageText(item);
            return text ? `${item.role === "user" ? "you" : "agent"}  ${text}` : "";
          })
          .filter(Boolean),
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
  const readyForCommand = status === "listening";
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
              ? "Say confirm or cancel"
              : active
                ? "Control this page by voice"
                : "Select to start listening"}
          </span>
        </div>
      </div>

      <div className="ck-voice-next" role="status" aria-live="polite">
        <span>
          {!active
            ? "Start voice, then say"
            : !readyForCommand
              ? "Wait for Listening"
              : nextCommand
                ? "Say this next"
                : "Mission complete"}
        </span>
        <strong>
          {active && !readyForCommand
            ? "Finishing the previous command…"
            : nextCommand
              ? `“${nextCommand}”`
              : "All four steps are complete."}
        </strong>
        <small>Leave voice control on between steps.</small>
      </div>

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
          <p>Say “confirm” or “cancel”, or use these buttons.</p>
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

      {transcript.length > 0 && (
        <details className="ck-voice-transcript">
          <summary>Transcript ({transcript.length})</summary>
          <pre>{transcript.join("\n")}</pre>
        </details>
      )}
    </aside>
  );
}
