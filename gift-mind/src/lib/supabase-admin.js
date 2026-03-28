import fs from "fs";
import path from "path";

import { createClient } from "@supabase/supabase-js";

/**
 * Next sometimes does not inject non-NEXT_PUBLIC_ keys into route handlers the way we expect.
 * We merge .env.local from disk (same folder as package.json) as a reliable fallback.
 */
let manualEnvAttempted = false;
let readDotLocalFromDisk = false;

function parseDotenvLines(content) {
  const out = {};
  if (!content) return out;
  for (let line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

function tryReadEnvLocalFile(dir) {
  const p = path.join(dir, ".env.local");
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function mergeManualEnvFromDisk() {
  if (manualEnvAttempted) return;
  manualEnvAttempted = true;

  const candidates = [
    process.cwd(),
    path.join(process.cwd(), "gift-mind"),
  ];

  const keysWeCareAbout = new Set([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GROQ_API_KEY",
  ]);

  for (const dir of candidates) {
    const raw = tryReadEnvLocalFile(dir);
    if (!raw) continue;
    readDotLocalFromDisk = true;
    const parsed = parseDotenvLines(raw);
    for (const key of keysWeCareAbout) {
      const v = parsed[key];
      if (typeof v !== "string" || !v.trim()) continue;
      const cur = process.env[key];
      if (cur === undefined || String(cur).trim() === "") {
        process.env[key] = v.trim();
      }
    }
    return;
  }
}

function envUrl() {
  mergeManualEnvFromDisk();
  return String(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  ).trim();
}

function envServiceRoleKey() {
  mergeManualEnvFromDisk();
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

/**
 * Which parts of Supabase env are present (no secret values).
 * Use GET /api/session to debug "configured: false".
 */
export function getSupabaseEnvStatus() {
  mergeManualEnvFromDisk();
  const url = envUrl();
  const key = envServiceRoleKey();
  return {
    hasUrl: url.length > 0,
    hasServiceRoleKey: key.length > 0,
    configured: url.length > 0 && key.length > 0,
    readDotLocalFromDisk,
  };
}

/**
 * Server-only Supabase client (service role). Never import in client components.
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabaseAdmin() {
  mergeManualEnvFromDisk();
  const url = envUrl();
  const key = envServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured() {
  return getSupabaseEnvStatus().configured;
}
