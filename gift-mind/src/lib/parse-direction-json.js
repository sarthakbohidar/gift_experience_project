/**
 * Normalize Groq JSON direction output (fences, leading prose).
 */

export function stripJsonFences(text) {
  return String(text ?? "")
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
}

/**
 * @returns {{ direction: object }}
 */
export function parseDirectionFromLlmContent(raw) {
  const cleaned = stripJsonFences(raw);

  const tryParse = (s) => {
    const o = JSON.parse(s);
    if (o && typeof o === "object" && o.direction && typeof o.direction === "object") {
      return o;
    }
    throw new Error("Missing direction object");
  };

  try {
    return tryParse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return tryParse(cleaned.slice(start, end + 1));
    }
  }

  throw new Error("Could not parse gift direction from the model.");
}

/**
 * True when the assistant accidentally streamed a full direction JSON in chat
 * (should not happen — used to still show Generate + friendlier bubble text).
 */
export function assistantMessageContainsParsableDirection(text) {
  const s = String(text ?? "").trim();
  if (s.length < 60) return false;
  if (!/headline/i.test(s)) return false;
  if (!/why_it_resonates|gift_story|"detail"|'detail'/i.test(s)) return false;
  try {
    parseDirectionFromLlmContent(s);
    return true;
  } catch {
    return false;
  }
}
