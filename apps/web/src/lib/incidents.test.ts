import assert from "node:assert/strict";
import test from "node:test";
import { findIncident, workspaceContext } from "./incidents";
import type { DemoFollowup } from "./app-actions";

test("selection changes the shared incident and timeline together", () => {
  const checkout = workspaceContext("INC-1042", []);
  const notifications = workspaceContext("INC-1043", []);
  assert.equal(checkout.selectedIncident.service, "Checkout API");
  assert.equal(notifications.selectedIncident.service, "Notifications");
  assert.match(notifications.selectedIncident.timeline[0].detail, /emails/);
  assert.equal(notifications.availableIncidents.length, 2);
});

test("workspace context labels sample incidents and local demo submissions", () => {
  const tasks: DemoFollowup[] = [
    {
      id: "demo-1",
      incidentId: "INC-1042",
      title: "Check pool metrics",
      details: "Check the connection pool after the deploy.",
      submittedAt: "2026-09-12T14:00:00.000Z",
    },
  ];
  const context = workspaceContext("INC-1042", tasks);
  assert.throws(() => findIncident("unknown"), /Unknown incident/);
  assert.match(context.dataSource, /Fictional sample/);
  assert.match(context.dataSource, /browser-only/);
  assert.deepEqual(context.submittedFollowups, tasks);
});
