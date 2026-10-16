import assert from "node:assert/strict";
import test from "node:test";
import { confirmationDecision } from "./voice-confirmation";

test("accepts natural but explicit approval phrases", () => {
  for (const phrase of [
    "Confirm.",
    "Confirm the send",
    "Please approve this submission",
    "Yes",
    "Yes, submit it",
    "Go ahead please",
    "Do it",
    "Proceed",
  ]) {
    assert.equal(confirmationDecision(phrase), "approve", phrase);
  }
});

test("negative language always rejects a pending action", () => {
  for (const phrase of [
    "Cancel",
    "No",
    "No, do not confirm",
    "Don't send it",
    "Not yet",
    "Stop",
    "Reject it",
  ]) {
    assert.equal(confirmationDecision(phrase), "reject", phrase);
  }
});

test("does not treat an ambiguous repeat of the action as approval", () => {
  for (const phrase of [
    "Confirm?",
    "Approve 123",
    "Yes/no",
    "I cannot approve this",
    "I might approve tomorrow",
    "Can you confirm what will happen?",
    "Yes, but first change the title",
    "I will approve later",
    "I’ll prove.",
    "I'll prove.",
    "Send it",
    "Maybe",
    "What changed?",
    "Sure",
    "I'll prove this works",
  ]) {
    assert.equal(confirmationDecision(phrase), null, phrase);
  }
});
