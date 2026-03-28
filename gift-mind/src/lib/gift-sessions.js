import { getSupabaseAdmin } from "@/lib/supabase-admin.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

/**
 * @param {{
 *   recipient?: string,
 *   occasion?: string,
 *   parentSessionId?: string | null,
 *   compassSelections?: Record<string, string> | null,
 * }} opts
 * @returns {Promise<string | null>}
 */
export async function createGiftSession(opts = {}) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const parent =
    opts.parentSessionId && isValidSessionId(opts.parentSessionId)
      ? opts.parentSessionId
      : null;

  const { data, error } = await sb
    .from("gift_sessions")
    .insert({
      recipient: typeof opts.recipient === "string" ? opts.recipient : "",
      occasion: typeof opts.occasion === "string" ? opts.occasion : "",
      parent_session_id: parent,
      compass_selections: opts.compassSelections ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Replace all messages for a session (initial seed or reset).
 * @param {string} sessionId
 * @param {Array<{ role: string, content: string, hidden?: boolean }>} messages
 */
export async function seedSessionMessages(sessionId, messages) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");

  await sb.from("gift_messages").delete().eq("session_id", sessionId);

  const list = Array.isArray(messages) ? messages : [];
  const rows = list
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        String(m.content || "").trim().length > 0
    )
    .map((m, i) => ({
      session_id: sessionId,
      role: m.role,
      content: String(m.content).trim(),
      hidden: Boolean(m.hidden),
      sort_order: i,
    }));

  if (rows.length === 0) return;

  const { error } = await sb.from("gift_messages").insert(rows);
  if (error) throw error;
}

/**
 * @param {string} sessionId
 * @returns {Promise<Array<{ role: string, content: string, hidden: boolean }>>}
 */
export async function fetchMessagesForModel(sessionId) {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("gift_messages")
    .select("role, content, hidden, sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => ({
    role: r.role,
    content: r.content,
    hidden: Boolean(r.hidden),
  }));
}

async function nextSortOrder(sb, sessionId) {
  const { data } = await sb
    .from("gift_messages")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const max = typeof data?.sort_order === "number" ? data.sort_order : -1;
  return max + 1;
}

/**
 * @param {string} sessionId
 * @param {{ role: 'user' | 'assistant', content: string, hidden?: boolean }} row
 */
export async function appendSessionMessage(sessionId, row) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");

  const sort = await nextSortOrder(sb, sessionId);
  const { error } = await sb.from("gift_messages").insert({
    session_id: sessionId,
    role: row.role,
    content: String(row.content || "").trim(),
    hidden: Boolean(row.hidden),
    sort_order: sort,
  });
  if (error) throw error;
}

export async function touchGiftSession(sessionId) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from("gift_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/**
 * @param {string} sessionId
 * @param {{
 *   recipient?: string,
 *   occasion?: string,
 *   lastDirection?: object,
 *   whereToLook?: unknown,
 *   compassSelections?: Record<string, string> | null,
 * }} patch
 */
export async function updateGiftSession(sessionId, patch) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");

  const row = {
    updated_at: new Date().toISOString(),
  };
  if (typeof patch.recipient === "string") row.recipient = patch.recipient;
  if (typeof patch.occasion === "string") row.occasion = patch.occasion;
  if (patch.lastDirection !== undefined) row.last_direction = patch.lastDirection;
  if (patch.whereToLook !== undefined) row.where_to_look = patch.whereToLook;
  if (patch.compassSelections !== undefined) row.compass_selections = patch.compassSelections;

  const { error } = await sb.from("gift_sessions").update(row).eq("id", sessionId);
  if (error) throw error;
}
