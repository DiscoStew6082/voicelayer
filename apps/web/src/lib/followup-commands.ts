import type { DemoFollowup, FollowupDraft, FollowupField } from "./app-actions";

export type FollowupSubmission = Readonly<FollowupDraft & { incidentId: string }>;
export type FollowupApproval = Readonly<{
  id: string;
  revision: number;
  draft: FollowupSubmission;
}>;
declare const approvalBrand: unique symbol;
export type FollowupApprovalToken = { readonly [approvalBrand]: true };

type State = Readonly<{
  selectedId: string;
  draft: Readonly<FollowupDraft>;
  pendingApproval: FollowupApproval | null;
  submitted: readonly DemoFollowup[];
}>;

/** The page owns this command boundary; adapters never submit arbitrary drafts. */
export class FollowupCommands {
  private state: State;
  private revision = 0;
  private tokens = new WeakMap<FollowupApprovalToken, FollowupApproval>();
  private listeners = new Set<() => void>();

  constructor(selectedId: string) {
    this.state = Object.freeze({
      selectedId,
      draft: Object.freeze({ title: "", details: "" }),
      pendingApproval: null,
      submitted: Object.freeze([]),
    });
  }

  getSnapshot = (): State => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(change: Partial<State>) {
    this.state = Object.freeze({ ...this.state, ...change });
    this.listeners.forEach((listener) => listener());
  }

  private invalidate() {
    this.revision++;
    this.tokens = new WeakMap();
  }

  selectIncident(selectedId: string) {
    if (selectedId === this.state.selectedId) return;
    this.invalidate();
    this.update({ selectedId, pendingApproval: null });
  }

  setField(field: FollowupField, value: string) {
    if (this.state.draft[field] === value) return;
    this.invalidate();
    this.update({
      draft: Object.freeze({ ...this.state.draft, [field]: value }),
      pendingApproval: null,
    });
  }

  requestApproval(expected?: FollowupSubmission): FollowupApproval {
    const draft = Object.freeze({ incidentId: this.state.selectedId, ...this.state.draft });
    if (expected && (expected.incidentId !== draft.incidentId ||
      expected.title !== draft.title || expected.details !== draft.details)) {
      throw new Error("The selection or draft changed. Review the current draft again.");
    }
    if (!draft.title.trim() || draft.title.length > 200 ||
      !draft.details.trim() || draft.details.length > 4000) {
      throw new Error("Enter a title (up to 200 characters) and details (up to 4000 characters).");
    }
    this.tokens = new WeakMap();
    const approval = Object.freeze({ id: crypto.randomUUID(), revision: this.revision, draft });
    this.update({ pendingApproval: approval });
    return approval;
  }

  approve(id: string): FollowupApprovalToken {
    const approval = this.state.pendingApproval;
    if (!approval || approval.id !== id || approval.revision !== this.revision) {
      throw new Error("This approval is no longer current. Review the draft again.");
    }
    const token = Object.freeze({}) as FollowupApprovalToken;
    this.tokens.set(token, approval);
    this.update({ pendingApproval: null });
    return token;
  }

  reject(id: string) {
    if (this.state.pendingApproval?.id !== id) return;
    this.invalidate();
    this.update({ pendingApproval: null });
  }

  submit(token: FollowupApprovalToken): DemoFollowup {
    const approval = this.tokens.get(token);
    this.tokens.delete(token); // Consume before any effect; retries require fresh review.
    if (!approval || approval.revision !== this.revision) {
      throw new Error("A current, unused approval is required to submit this draft.");
    }
    const followup = Object.freeze({
      ...approval.draft,
      id: `demo-${crypto.randomUUID()}`,
      submittedAt: new Date().toISOString(),
    });
    this.invalidate();
    this.update({
      draft: Object.freeze({ title: "", details: "" }),
      pendingApproval: null,
      submitted: Object.freeze([...this.state.submitted, followup]),
    });
    return followup;
  }
}
