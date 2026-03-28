/**
 * Strip LLM placeholders from card copy for display / clipboard.
 * @param {string} text
 */
export function sanitizeGiftStory(text) {
  const s = typeof text === "string" ? text : "";
  let out = s.replace(/\[.*?\]/g, "").replace(/\s{2,}/g, " ").trim();
  out = out.replace(/^,\s*/, "").replace(/\s+,/g, ",").trim();
  if (!out) return "With love.";
  return out;
}
