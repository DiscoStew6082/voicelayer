"use client";

import { useFrontendTool, useAgentContext } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { findIncident, workspaceContext } from "@/lib/incidents";
import type { AppActions } from "@/lib/app-actions";

export function AppControl({
  selectedId,
  actions,
}: {
  selectedId: string;
  actions: AppActions;
}) {
  useAgentContext({
    description:
      "The incident workspace currently visible to the user, including the selected sample incident, draft fields, browser-only demo submissions, focus, and scroll state. Use semantic page tools instead of describing clicks or coordinates.",
    value: {
      ...workspaceContext(selectedId, actions.readContext().submittedFollowups),
      visibleApplication: actions.readContext(),
    },
  });

  useFrontendTool(
    {
      name: "select_incident",
      description:
        "Open an existing sample incident in the workspace. Use an ID from availableIncidents.",
      parameters: z.object({ incidentId: z.string() }),
      handler: async ({ incidentId }) => {
        const incident = findIncident(incidentId);
        return actions.openIncident(incident.id);
      },
    },
    [actions.openIncident],
  );

  useFrontendTool(
    {
      name: "select_visible_item",
      description:
        "Select an incident by its one-based position in visibleApplication.availableIncidents.",
      parameters: z.object({ position: z.number().int().min(1) }),
      handler: async ({ position }) => actions.openIncidentAt(position),
    },
    [actions.openIncidentAt],
  );

  useFrontendTool(
    {
      name: "scroll_page",
      description: "Scroll the visible application up or down by one viewport step.",
      parameters: z.object({ direction: z.enum(["up", "down"]) }),
      handler: async ({ direction }) => actions.scrollPage(direction),
    },
    [actions.scrollPage],
  );

  useFrontendTool(
    {
      name: "go_back",
      description: "Return to the previously selected incident in this application.",
      parameters: z.object({}),
      handler: async () => actions.goBack(),
    },
    [actions.goBack],
  );

  useFrontendTool(
    {
      name: "set_followup_field",
      description: "Fill a visible follow-up form field with the user's text.",
      parameters: z.object({
        field: z.enum(["title", "details"]),
        value: z.string().max(4000),
      }),
      handler: async ({ field, value }) =>
        actions.setFollowupField(field, value),
    },
    [actions.setFollowupField],
  );

  return null;
}
