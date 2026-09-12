export type ConfirmationDecision = "approve" | "reject" | null;

/**
 * Interpret only an explicit response while a consequential action is pending.
 * Negative language wins so phrases such as "do not confirm" can never approve.
 */
export function confirmationDecision(text: string): ConfirmationDecision {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
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

  if (
    /\b(confirm|approve)\b/.test(normalized) ||
    /^(yes\b|go ahead\b|do it\b|proceed\b)/.test(normalized) ||
    // In the captured noisy-room demo, an explicit "I approve" was
    // transcribed as the exact homophone "I'll prove." Accept only that short
    // standalone recognition variant, and only while an approval is pending.
    /^(i'll|ill) prove$/.test(normalized)
  ) {
    return "approve";
  }

  return null;
}
