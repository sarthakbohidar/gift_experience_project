/** sessionStorage key for compass → result handoff */
export const GIFTMIND_DIRECTION_KEY = "giftmind_direction";

/** One-shot payload when user taps "Go deeper" → /chat?deep=1 */
export const GIFTMIND_CHAT_BOOTSTRAP_KEY = "giftmind_chat_bootstrap";

/**
 * Build POST body for /api/compass/generate from selections keyed by fork id.
 * @param {Record<string, string>} selectionsByForkId
 */
export function buildCompassGenerateBody(selectionsByForkId) {
  const s = selectionsByForkId || {};
  return {
    recipient: s.step0_recipient,
    occasion: s.step1_occasion,
    forks: {
      step2_experience: s.step2_experience,
      step3_vibe: s.step3_vibe,
      step4_nature: s.step4_nature,
      step5_practical: s.step5_practical,
    },
  };
}

const REQUIRED_FORK_IDS = [
  "step0_recipient",
  "step1_occasion",
  "step2_experience",
  "step3_vibe",
  "step4_nature",
  "step5_practical",
];

export function isCompassSelectionComplete(selectionsByForkId) {
  const s = selectionsByForkId || {};
  return REQUIRED_FORK_IDS.every(
    (id) => typeof s[id] === "string" && s[id].length > 0
  );
}

/**
 * @returns {{
 *   direction: object,
 *   where_to_look: array,
 *   recipient?: string,
 *   occasion?: string,
 *   compass_selections?: Record<string, string>,
 *   chat_transcript?: Array<{ role: string, content: string }>,
 * } | null}
 */
function getBrowserSessionStorage() {
  if (typeof globalThis === "undefined") return null;
  try {
    return globalThis.window?.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function readDirectionFromSession() {
  const storage = getBrowserSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(GIFTMIND_DIRECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.direction) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   direction: object,
 *   where_to_look: array,
 *   recipient?: string,
 *   occasion?: string,
 *   compass_selections?: Record<string, string>,
 *   chat_transcript?: Array<{ role: string, content: string }>,
 * }} data
 */
export function writeDirectionToSession(data) {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(GIFTMIND_DIRECTION_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

export function clearDirectionFromSession() {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(GIFTMIND_DIRECTION_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {{
 *   recipient: string,
 *   occasion: string,
 *   initialMessages: Array<{ role: string, content: string, hidden?: boolean }>,
 * }} data
 */
export function writeChatBootstrapToSession(data) {
  const storage = getBrowserSessionStorage();
  if (!storage || !data || typeof data !== "object") return;
  try {
    storage.setItem(GIFTMIND_CHAT_BOOTSTRAP_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

/**
 * Read bootstrap without removing (use with clearChatBootstrapFromSession after UI applies).
 * @returns {{
 *   recipient: string,
 *   occasion: string,
 *   initialMessages: Array<{ role: string, content: string, hidden?: boolean }>,
 * } | null}
 */
export function peekChatBootstrapFromSession() {
  const storage = getBrowserSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(GIFTMIND_CHAT_BOOTSTRAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.recipient !== "string" || typeof parsed.occasion !== "string") return null;
    if (!Array.isArray(parsed.initialMessages) || parsed.initialMessages.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearChatBootstrapFromSession() {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(GIFTMIND_CHAT_BOOTSTRAP_KEY);
  } catch {
    // ignore
  }
}

/**
 * @returns {{
 *   recipient: string,
 *   occasion: string,
 *   initialMessages: Array<{ role: string, content: string, hidden?: boolean }>,
 * } | null}
 */
export function readAndClearChatBootstrapFromSession() {
  const data = peekChatBootstrapFromSession();
  clearChatBootstrapFromSession();
  return data;
}
