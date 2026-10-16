import assert from "node:assert/strict";
import test from "node:test";
import { FollowupCommands, type FollowupApprovalToken } from "./followup-commands";

function draft() {
  const commands = new FollowupCommands("incident-a");
  commands.setField("title", "Check the queue");
  commands.setField("details", "  Keep exact spaces and details.  ");
  return commands;
}

test("one-use approval saves the immutable, exact draft", () => {
  const commands = draft();
  const approval = commands.requestApproval();
  assert.ok(Object.isFrozen(approval.draft));
  const token = commands.approve(approval.id);
  const saved = commands.submit(token);
  assert.equal(saved.incidentId, "incident-a");
  assert.equal(saved.details, "  Keep exact spaces and details.  ");
  assert.throws(() => commands.submit(token), /unused approval/);
  assert.equal(commands.getSnapshot().submitted.length, 1);
  assert.equal(commands.getSnapshot().draft.title, "");
});

test("a draft object or forged token cannot bypass approval", () => {
  const commands = draft();
  assert.throws(() => commands.submit({} as FollowupApprovalToken), /approval/);
  assert.equal(commands.getSnapshot().submitted.length, 0);
});

test("edits and incident switches revoke pending and issued approvals, even after reverting", () => {
  for (const issued of [false, true]) {
    for (const change of ["draft", "incident"]) {
      const commands = draft();
      const approval = commands.requestApproval();
      const token = issued ? commands.approve(approval.id) : null;
      if (change === "draft") {
        commands.setField("title", "Changed");
        commands.setField("title", approval.draft.title);
      } else {
        commands.selectIncident("incident-b");
        commands.selectIncident("incident-a");
      }
      assert.equal(commands.getSnapshot().pendingApproval, null);
      assert.throws(() => token ? commands.submit(token) : commands.approve(approval.id));
      assert.equal(commands.getSnapshot().submitted.length, 0);
    }
  }
});

test("cancellation, replacement, and double approval cannot submit", () => {
  const commands = draft();
  const first = commands.requestApproval();
  commands.reject(first.id);
  assert.throws(() => commands.approve(first.id));
  const second = commands.requestApproval();
  const third = commands.requestApproval();
  assert.throws(() => commands.approve(second.id));
  const token = commands.approve(third.id);
  assert.throws(() => commands.approve(third.id));
  commands.requestApproval();
  assert.throws(() => commands.submit(token));
});

test("review requires valid fields and the current exact selection and draft", () => {
  assert.throws(() => new FollowupCommands("a").requestApproval(), /Enter a title/);
  const commands = draft();
  for (const changed of [{ incidentId: "wrong" }, { title: "wrong" }, { details: "wrong" }]) {
    assert.throws(() => commands.requestApproval({
      incidentId: "incident-a", ...commands.getSnapshot().draft, ...changed,
    }), /changed/);
  }
  commands.setField("title", " ");
  assert.throws(() => commands.requestApproval(), /Enter a title/);
});

test("synchronous commands expose current state before a React render", () => {
  const commands = draft();
  let notifications = 0;
  const unsubscribe = commands.subscribe(() => notifications++);
  commands.selectIncident("b");
  commands.setField("title", "Latest");
  assert.equal(commands.requestApproval().draft.incidentId, "b");
  assert.equal(commands.getSnapshot().pendingApproval?.draft.title, "Latest");
  assert.equal(notifications, 3);
  unsubscribe();
});

test("capabilities cannot be copied or transferred to another page owner", () => {
  const owner = draft();
  const other = draft();
  const review = owner.requestApproval();
  const token = owner.approve(review.id);
  assert.throws(() => owner.submit({ ...token } as FollowupApprovalToken), /approval/);
  assert.throws(() => other.submit(token), /approval/);
  assert.equal(other.getSnapshot().submitted.length, 0);
  assert.equal(owner.submit(token).title, review.draft.title);
});
