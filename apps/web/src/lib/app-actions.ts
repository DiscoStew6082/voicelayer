export type FollowupDraft = {
  title: string;
  details: string;
};

export type FollowupField = keyof FollowupDraft;

export type DemoFollowup = FollowupDraft & {
  id: string;
  incidentId: string;
  submittedAt: string;
};

export type AppContextSnapshot = {
  view: "incident_workspace";
  dataSource: string;
  availableIncidents: Array<{
    position: number;
    id: string;
    title: string;
    status: string;
    updated: string;
  }>;
  selectedIncident: {
    id: string;
    title: string;
    severity: string;
    status: string;
    service: string;
    owner: string;
    channel: string;
    updated: string;
    summary: string;
    impact: string;
    timeline: Array<{ time: string; author: string; detail: string }>;
  };
  selectedPosition: number;
  followupForm: FollowupDraft;
  submittedFollowups: DemoFollowup[];
  focusedControl: string | null;
  viewport: {
    scrollY: number;
    canScrollUp: boolean;
    canScrollDown: boolean;
  };
  pendingAction: "submit_followup" | null;
};

/**
 * The application owns these semantic actions. CopilotKit and OpenAI Realtime
 * are adapters over this interface; neither agent reaches for DOM coordinates.
 */
export type AppActions = {
  readContext: () => AppContextSnapshot;
  openIncident: (incidentId: string) => string;
  openIncidentAt: (position: number) => string;
  goBack: () => string;
  scrollPage: (direction: "up" | "down") => string;
  setFollowupField: (field: FollowupField, value: string) => string;
  submitApprovedFollowup: (draft: {
    incidentId: string;
    title: string;
    details: string;
  }) => Promise<DemoFollowup>;
};
