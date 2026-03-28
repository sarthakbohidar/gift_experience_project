import { assistantMessageContainsParsableDirection } from "@/lib/parse-direction-json.js";

/**
 * Parse one SSE line from /api/chat/message (e.g. `data: {"text":"hi"}`).
 * @returns {{ type: 'text', text: string } | { type: 'done' } | null}
 */
export function parseChatSseLine(line) {
  const trimmed = String(line).trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return { type: "done" };
  try {
    const obj = JSON.parse(payload);
    if (obj && typeof obj.text === "string") return { type: "text", text: obj.text };
  } catch {
    return null;
  }
  return null;
}

/**
 * Split accumulated stream buffer on complete SSE events (`\n\n`).
 * Returns parsed events and the remainder (possibly incomplete event).
 * @param {string} buffer
 * @returns {{ events: Array<{ type: 'text', text: string } | { type: 'done' }>, rest: string }}
 */
export function extractSseEvents(buffer) {
  const events = [];
  let rest = buffer;
  let idx = rest.indexOf("\n\n");
  while (idx !== -1) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    for (const line of block.split("\n")) {
      const e = parseChatSseLine(line);
      if (e) events.push(e);
    }
    idx = rest.indexOf("\n\n");
  }
  return { events, rest };
}

/**
 * True when assistant text matches Phase 5 “ready to synthesize” heuristics.
 * Aligns with CHAT_SYSTEM_PROMPT transition phrases.
 */
/**
 * Only true for explicit “hand off to generate” lines — not generic “something special”
 * in questions or gift suggestions (those caused false positives for the Generate CTA).
 */
export function detectSynthesisReady(assistantPlainText) {
  const t = String(assistantPlainText || "").toLowerCase().replace(/\s+/g, " ");
  if (!t.trim()) return false;

  if (t.includes("clear picture")) return true;
  if (t.includes("let me craft")) return true;
  if (t.includes("put together something")) return true;
  if (t.includes("ready to craft your direction")) return true;

  if (
    t.includes("i have something special for you") ||
    t.includes("i've got something special for you") ||
    t.includes("i’ve got something special for you")
  ) {
    return true;
  }

  return false;
}

/** True when the Generate CTA should appear (hand-off phrase or leaked direction JSON). */
export function shouldOfferSynthesizeFromAssistantMessage(assistantPlainText) {
  return (
    detectSynthesisReady(assistantPlainText) ||
    assistantMessageContainsParsableDirection(assistantPlainText)
  );
}

function displayOccasionParam(o) {
  const s = typeof o === "string" ? o.trim() : "";
  if (!s) return "";
  return s.replace(/_/g, " ");
}

function displayRecipientParam(r) {
  const s = typeof r === "string" ? r.trim() : "";
  if (!s) return "";
  const map = {
    partner: "partner",
    parent: "mom or dad",
    sibling: "sibling",
    friend: "close friend",
    acquaintance: "someone you don't know well yet",
  };
  return map[s] || s;
}

/**
 * Human-readable defaults for API body when query params are missing.
 */
export function defaultChatContextFromParams(recipient, occasion) {
  const r = typeof recipient === "string" ? recipient.trim() : "";
  const o = typeof occasion === "string" ? occasion.trim() : "";
  return {
    recipient: r || "someone you care about",
    occasion: o || "this moment",
  };
}

/**
 * First assistant turn (before user messages).
 * @param {string} recipientParam raw query param (may be empty)
 * @param {string} occasionParam raw query param (may be empty)
 */
export function buildInitialAssistantContent(recipientParam, occasionParam) {
  const r = typeof recipientParam === "string" ? recipientParam.trim() : "";
  const o = typeof occasionParam === "string" ? occasionParam.trim() : "";
  if (r && o) {
    const who = displayRecipientParam(r);
    const when = displayOccasionParam(o);
    return `Hey! 👋 You're gifting for your ${who} for ${when} — love that. Let's make it special. What's one small thing they do that always makes you smile?`;
  }
  return `Hey! 👋 Tell me about the person you're getting a gift for. Who are they to you, and what's the occasion?`;
}
