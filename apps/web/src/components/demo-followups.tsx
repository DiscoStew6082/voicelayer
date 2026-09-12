"use client";

import { useEffect, useState, type FormEvent } from "react";
import type {
  DemoFollowup,
  FollowupDraft,
  FollowupField,
} from "@/lib/app-actions";

export function DemoFollowups({
  incidentId,
  draft,
  submitted,
  setDraftField,
  onFocusField,
  onSubmit,
}: {
  incidentId: string;
  draft: FollowupDraft;
  submitted: DemoFollowup[];
  setDraftField: (field: FollowupField, value: string) => void;
  onFocusField: (field: FollowupField) => void;
  onSubmit: (draft: FollowupDraft & { incidentId: string }) => Promise<DemoFollowup>;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setReviewing(false);
    setNotice("");
  }, [incidentId]);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewing(true);
    setNotice("");
  }

  async function approve() {
    await onSubmit({ incidentId, ...draft });
    setReviewing(false);
    setNotice("Submitted in this demo. Nothing was sent outside the browser.");
  }

  return (
    <section
      id="followup-editor"
      className="ck-followups"
      aria-labelledby="followup-title"
    >
      <header className="ck-followups-header">
        <div>
          <h2 id="followup-title">Draft a follow-up</h2>
          <p className="ck-local-note">
            Type here or ask the voice agent to fill these fields. Submitting
            always requires your confirmation.
          </p>
        </div>
        <span className="ck-tag">Browser demo</span>
      </header>

      {submitted.length > 0 && (
        <div className="ck-demo-submissions" aria-label="Demo submissions">
          <strong>Submitted in this session</strong>
          <ul className="ck-task-list">
            {[...submitted].reverse().map((item) => (
              <li key={item.id}>
                <span className="ck-demo-check" aria-hidden="true">✓</span>
                <div>
                  <strong>{item.title}</strong>
                  <p className="ck-muted">{item.details}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={review} className="ck-task-form ck-task-form--stacked">
        <label className="ck-field-label" htmlFor="task-title">
          Follow-up title
        </label>
        <input
          id="task-title"
          value={draft.title}
          onChange={(event) => setDraftField("title", event.target.value)}
          onFocus={() => onFocusField("title")}
          maxLength={200}
          placeholder="Example: Check connection pool limits"
          required
        />
        <label className="ck-field-label" htmlFor="task-details">
          Details
        </label>
        <textarea
          id="task-details"
          value={draft.details}
          onChange={(event) => setDraftField("details", event.target.value)}
          onFocus={() => onFocusField("details")}
          maxLength={4000}
          placeholder="Describe what should happen next"
          required
          rows={3}
        />
        <button className="ck-btn ck-btn--primary" type="submit">
          Review submission
        </button>
      </form>

      {reviewing && (
        <section className="ck-approval" aria-label="Confirm demo submission">
          <h3>Submit this follow-up?</h3>
          <strong>{draft.title}</strong>
          <p className="ck-preserve-lines">{draft.details}</p>
          <p>
            This only updates the on-screen demo. Nothing will be sent to an
            external service.
          </p>
          <div className="ck-approval-actions">
            <button
              type="button"
              className="ck-btn ck-btn--primary"
              onClick={() => void approve()}
            >
              Confirm submission
            </button>
            <button
              type="button"
              className="ck-btn"
              onClick={() => setReviewing(false)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <p role="status" className="ck-notice">
        {notice}
      </p>
    </section>
  );
}
