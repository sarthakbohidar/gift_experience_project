/**
 * Map Groq SDK (or fetch) errors to HTTP status + a safe client-facing message.
 * @param {unknown} err
 * @returns {{ status: number, error: string }}
 */
export function groqErrorToHttpResponse(err) {
  const status = typeof err?.status === "number" ? err.status : 0;
  const raw = String(err?.message ?? err ?? "");

  if (
    status === 429 ||
    /\brate limit\b/i.test(raw) ||
    /\brate_limit/i.test(raw) ||
    /\btokens per day\b/i.test(raw) ||
    /^429\b/.test(raw.trim())
  ) {
    return {
      status: 429,
      error:
        "GiftMind hit the AI provider’s usage limit. Wait a few minutes and try again, or check your plan at console.groq.com.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      status,
      error:
        "GiftMind couldn’t authorize with the AI service. If you’re running locally, confirm GROQ_API_KEY in .env.local.",
    };
  }

  if (status >= 400 && status < 500) {
    return {
      status,
      error:
        raw.length > 0 && raw.length < 280
          ? raw
          : "The AI service couldn’t process this request. Please try again.",
    };
  }

  return {
    status: 500,
    error:
      raw.length > 0 && raw.length < 280
        ? raw
        : "Something went wrong talking to the AI service. Please try again shortly.",
  };
}
