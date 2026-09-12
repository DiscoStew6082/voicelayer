"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { GenerativeUI } from "@/components/generative-ui";
import { AppControl } from "@/components/app-control";
import { findIncident, incidents, workspaceContext } from "@/lib/incidents";
import { DemoFollowups } from "@/components/demo-followups";
import { VoiceControl } from "@/components/voice-control";
import type {
  AppActions,
  DemoFollowup,
  FollowupDraft,
  FollowupField,
} from "@/lib/app-actions";

export default function Home() {
  const [selectedId, setSelectedId] = useState<string>(incidents[0].id);
  const [draft, setDraft] = useState<FollowupDraft>({
    title: "",
    details: "",
  });
  const [submittedFollowups, setSubmittedFollowups] = useState<DemoFollowup[]>([]);
  const selectionHistory = useRef<string[]>([]);
  const lastFocusedControl = useRef<string | null>(null);
  const selectedIdRef = useRef(selectedId);
  const draftRef = useRef(draft);
  const submittedFollowupsRef = useRef(submittedFollowups);
  selectedIdRef.current = selectedId;
  draftRef.current = draft;
  submittedFollowupsRef.current = submittedFollowups;
  const incidentFollowups = submittedFollowups.filter(
    (item) => item.incidentId === selectedId,
  );
  const missionIncidentId = incidents[1].id;
  const missionSubmission = submittedFollowups.find(
    (item) => item.incidentId === missionIncidentId,
  );
  const missionSubmitted = Boolean(missionSubmission);
  const missionSteps = [
    {
      label: "Open the incident",
      command: "Open the second incident",
      complete: missionSubmitted || selectedId === missionIncidentId,
    },
    {
      label: "Add a title",
      command: "Fill the title with Check notification backlog",
      complete: missionSubmitted || Boolean(draft.title.trim()),
    },
    {
      label: "Add details",
      command: "Fill the details with Confirm the queue is drained by 10:30",
      complete: missionSubmitted || Boolean(draft.details.trim()),
    },
    {
      label: "Review and submit",
      command: "Send it",
      complete: missionSubmitted,
    },
  ];
  const nextMissionStep = missionSteps.find((step) => !step.complete);
  const { selectedIncident: incident } = workspaceContext(selectedId, incidentFollowups);
  const selectIncident = useCallback((id: string) => {
    const nextId = findIncident(id).id;
    if (nextId === selectedIdRef.current) return;
    selectionHistory.current.push(selectedIdRef.current);
    setSelectedId(nextId);
  }, []);

  const revealActionTarget = useCallback((targetId: string) => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      target.classList.remove("ck-action-target");
      void target.offsetWidth;
      target.classList.add("ck-action-target");
      window.setTimeout(() => target.classList.remove("ck-action-target"), 2200);
    });
  }, []);

  const openIncident = useCallback(
    (id: string) => {
      const next = findIncident(id);
      selectIncident(next.id);
      revealActionTarget("incident-panel");
      return `Opened ${next.title}.`;
    },
    [revealActionTarget, selectIncident],
  );

  const openIncidentAt = useCallback(
    (position: number) => {
      const next = incidents[position - 1];
      if (!next)
        return `There is no item ${position}. There are ${incidents.length} visible items.`;
      return openIncident(next.id);
    },
    [openIncident],
  );

  const goBack = useCallback(() => {
    const previousId = selectionHistory.current.pop();
    if (!previousId) return "There is no previous in-app selection.";
    const previous = findIncident(previousId);
    setSelectedId(previous.id);
    revealActionTarget("incident-panel");
    return `Went back to ${previous.title}.`;
  }, [revealActionTarget]);

  const scrollPage = useCallback((direction: "up" | "down") => {
    if (typeof window === "undefined") return "The page is not available.";
    window.scrollBy({
      top: (direction === "down" ? 1 : -1) * window.innerHeight * 0.75,
      behavior: "smooth",
    });
    return `Scrolled ${direction}.`;
  }, []);

  const setFollowupField = useCallback(
    (field: FollowupField, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      revealActionTarget("followup-editor");
      return `Updated the follow-up ${field} field.`;
    },
    [revealActionTarget],
  );

  const readContext = useCallback(() => {
    const currentId = selectedIdRef.current;
    const currentIncident = findIncident(currentId);
    const followups = submittedFollowupsRef.current.filter(
      (item) => item.incidentId === currentId,
    );
    let focusedControl: string | null = null;
    let scrollY = 0;
    let canScrollDown = false;
    if (typeof document !== "undefined" && typeof window !== "undefined") {
      const active = document.activeElement;
      const activeLabel =
        active?.getAttribute("aria-label") ??
        (active instanceof HTMLElement ? active.innerText || active.id : null) ??
        null;
      focusedControl = active?.closest(".ck-voice-control")
        ? lastFocusedControl.current
        : activeLabel || lastFocusedControl.current;
      scrollY = Math.round(window.scrollY);
      canScrollDown =
        window.scrollY + window.innerHeight <
        document.documentElement.scrollHeight - 2;
    }
    return {
      view: "incident_workspace" as const,
      dataSource:
        "Fictional sample incidents. Submitted follow-ups stay in browser memory for this demo.",
      availableIncidents: incidents.map((item, index) => ({
        position: index + 1,
        id: item.id,
        title: item.title,
        status: item.status,
        updated: item.updated,
      })),
      selectedIncident: {
        ...currentIncident,
        timeline: [...currentIncident.timeline],
      },
      selectedPosition:
        incidents.findIndex((item) => item.id === currentId) + 1,
      followupForm: { ...draftRef.current },
      submittedFollowups: followups,
      focusedControl,
      viewport: {
        scrollY,
        canScrollUp: scrollY > 0,
        canScrollDown,
      },
      pendingAction: null,
    };
  }, []);

  const submitApprovedFollowup = useCallback(
    async (submission: {
      incidentId: string;
      title: string;
      details: string;
    }) => {
      const followup: DemoFollowup = {
        id: `demo-${Date.now()}`,
        ...submission,
        submittedAt: new Date().toISOString(),
      };
      setSubmittedFollowups((current) => [...current, followup]);
      setDraft({ title: "", details: "" });
      revealActionTarget("followup-editor");
      return followup;
    },
    [revealActionTarget],
  );

  const actions = useMemo<AppActions>(
    () => ({
      readContext,
      openIncident,
      openIncidentAt,
      goBack,
      scrollPage,
      setFollowupField,
      submitApprovedFollowup,
    }),
    [
      goBack,
      openIncident,
      openIncidentAt,
      readContext,
      scrollPage,
      setFollowupField,
      submitApprovedFollowup,
    ],
  );

  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Summarize this incident",
          message:
            "Summarize the selected incident using the page context. What needs attention?",
        },
        {
          title: "Fill in a follow-up",
          message:
            "Fill the visible follow-up title and details with one useful next step for the selected incident. Do not submit it.",
        },
      ],
      available: "before-first-message",
    },
    [],
  );

  return (
    <>
      <GenerativeUI />
      <AppControl
        selectedId={selectedId}
        actions={actions}
      />
      <main className="ck-workspace">
        <header className="ck-workspace-header">
          <div>
            <p className="ck-eyebrow">Incident operations</p>
            <h1>Incident response workspace</h1>
            <p className="ck-intro">
              Review active incidents and coordinate the next response.
            </p>
          </div>
          <span className="ck-tag ck-tag--preview">Voice control available</span>
        </header>

        <div className="ck-workspace-grid">
          <section
            id="incident-panel"
            className="ck-panel"
            aria-labelledby="incident-title"
          >
            <div className="ck-incident-picker">
              <label htmlFor="incident-select">Choose an incident</label>
              <select
                id="incident-select"
                value={selectedId}
                onChange={(event) => selectIncident(event.target.value)}
              >
                {incidents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {item.service}
                  </option>
                ))}
              </select>
            </div>

            <div className="ck-detail">
              <span className="ck-status-label">{incident.status}</span>
              <h2 id="incident-title">{incident.title}</h2>
              <p>{incident.summary}</p>
              <details className="ck-more" key={incident.id}>
                <summary>Details &amp; timeline</summary>
                <dl className="ck-detail-facts">
                  <div>
                    <dt>Incident lead</dt>
                    <dd>{incident.owner}</dd>
                  </div>
                  <div>
                    <dt>Severity</dt>
                    <dd>{incident.severity}</dd>
                  </div>
                  <div>
                    <dt>Last update</dt>
                    <dd>{incident.updated}</dd>
                  </div>
                </dl>
                <h3>Impact</h3>
                <p>{incident.impact}</p>
                <h3>Timeline</h3>
                <ol className="ck-timeline">
                  {incident.timeline.map((event) => (
                    <li key={event.time}>
                      <time>{event.time} UTC</time>
                      <div>
                        <strong>{event.author}</strong>
                        <p>{event.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </div>

            <DemoFollowups
              incidentId={selectedId}
              draft={draft}
              submitted={incidentFollowups}
              setDraftField={(field, value) => {
                setDraft((current) => ({ ...current, [field]: value }));
              }}
              onFocusField={(field) => {
                lastFocusedControl.current = `follow-up ${field}`;
              }}
              onSubmit={submitApprovedFollowup}
            />
          </section>

          <section
            className="ck-panel ck-assistant"
            aria-labelledby="assistant-title"
          >
            <header className="ck-assistant-header">
              <h2 id="assistant-title">Assistant</h2>
              <p>
                Type or speak to work with the currently selected incident.
              </p>
            </header>
            <CopilotChat
              className="ck-chat"
              labels={{
                welcomeMessageText: "What would you like to do?",
                chatInputPlaceholder: "Ask a question or request a page action…",
              }}
            />
          </section>
        </div>
      </main>
      <VoiceControl
        actions={actions}
        nextCommand={nextMissionStep?.command ?? null}
      />
    </>
  );
}
