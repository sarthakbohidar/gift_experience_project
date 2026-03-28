/**
 * Human-readable error strings for API / network failures (Phase 6 polish).
 */

/**
 * @param {unknown} err
 * @param {"stream" | "synthesize"} context
 */
export function friendlyChatError(err, context = "stream") {
  const m = String(err?.message ?? err ?? "").toLowerCase();

  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed")
  ) {
    return context === "synthesize"
      ? "We couldn’t finish your direction. Check your connection and try again."
      : "We couldn’t reach GiftMind. Check your connection and try again in a moment.";
  }

  if (
    /\b401\b|\b403\b/.test(m) ||
    m.includes("unauthorized") ||
    m.includes("invalid api key") ||
    m.includes("api key")
  ) {
    return "GiftMind couldn’t authorize with the AI service. If you’re running locally, confirm GROQ_API_KEY in .env.local.";
  }

  if (m.includes("429") || m.includes("rate limit") || m.includes("usage limit")) {
    return context === "synthesize"
      ? "GiftMind hit the AI provider’s usage limit. Wait a few minutes, then try Generate again."
      : "GiftMind hit the AI provider’s usage limit. Wait a few minutes and try again.";
  }

  if (m.includes("500") || m.includes("internal server")) {
    return "Something went wrong on our side. Please try again shortly.";
  }

  const raw = String(err?.message ?? "").trim();
  if (raw.length > 0) return raw;

  return context === "synthesize"
    ? "We couldn’t build your direction. Please try again."
    : "Something went wrong. Please try again.";
}
