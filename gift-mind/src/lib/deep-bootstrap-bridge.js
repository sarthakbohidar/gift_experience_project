/**
 * Holds "Go deeper" bootstrap in module memory across React Strict Mode remounts.
 * sessionStorage alone fails: first mount read-and-clears before the second mount runs.
 */

let stashed = null;
let postInFlight = false;

/**
 * Call from result pages right before navigating to /chat?deep=1
 * @param {{ recipient: string, occasion: string, initialMessages: unknown[] } | null} payload
 */
export function stashGoDeeperBootstrap(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(payload.initialMessages) &&
    payload.initialMessages.length > 0
  ) {
    stashed = payload;
  }
}

export function peekGoDeeperBootstrap() {
  return stashed;
}

export function clearGoDeeperBootstrap() {
  stashed = null;
}

/** @returns {boolean} true if this invocation should run POST /api/session for go-deeper */
export function beginGoDeeperSessionPost() {
  if (postInFlight) return false;
  postInFlight = true;
  return true;
}

export function endGoDeeperSessionPost() {
  postInFlight = false;
}
