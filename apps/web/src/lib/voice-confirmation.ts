export type ConfirmationDecision = "approve" | "reject" | null;

/**
 * Interpret only an explicit response while a consequential action is pending.
 * Negative language wins so phrases such as "do not confirm" can never approve.
 */
export function confirmationDecision(text: string): ConfirmationDecision {
  const normalized = text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[.,!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  if (
    /\b(cancel|reject|stop)\b/.test(normalized) ||
    /\b(do not|don't|never|not yet)\b/.test(normalized) ||
    /^no\b/.test(normalized)
  ) {
    return "reject";
  }

  // Whole utterances only. Questions, qualifications, future intentions, and
  // homophones are ambiguous; the accessible buttons remain available.
  const affirmatives = new Set([
    "confirm", "confirm the send", "confirm submission", "i confirm",
    "approve", "i approve", "approve this submission", "please approve this submission",
    "yes", "yes confirm", "yes submit it", "go ahead", "go ahead please",
    "do it", "proceed",
  ]);
  if (affirmatives.has(normalized)) return "approve";

  return null;
}
