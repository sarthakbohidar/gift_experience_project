import { NextResponse } from "next/server";

import { getSupabaseEnvStatus, isSupabaseConfigured } from "@/lib/supabase-admin.js";
import {
  createGiftSession,
  isValidSessionId,
  seedSessionMessages,
} from "@/lib/gift-sessions.js";

export const dynamic = "force-dynamic";

/** Quick check: open /api/session in the browser while dev is running. */
export async function GET() {
  const status = getSupabaseEnvStatus();
  const cwd = process.cwd();
  const inGiftMind = cwd.replace(/\\/g, "/").endsWith("gift-mind");

  return NextResponse.json({
    supabaseConfigured: status.configured,
    hasUrl: status.hasUrl,
    hasServiceRoleKey: status.hasServiceRoleKey,
    readDotLocalFromDisk: status.readDotLocalFromDisk,
    nextJsCwd: cwd,
    cwdLooksLikeGiftMind: inGiftMind,
    hint: status.configured
      ? "POST JSON to create a session; chat page does this automatically."
      : !inGiftMind
        ? "Next.js cwd is not the gift-mind folder — stop dev, then: cd gift-mind && npm run dev (so .env.local next to package.json is loaded)."
        : !status.hasUrl || !status.hasServiceRoleKey
          ? "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to gift-mind/.env.local (exact names, no quotes), save, restart npm run dev."
          : "Env looks set; if inserts still fail, check the service_role key format in Supabase Project Settings → API.",
  });
}

/**
 * Create a persisted chat session and optional initial messages (opener / go-deeper seed).
 */
export async function POST(req) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ id: null, persistence: "off" });
    }

    const body = await req.json().catch(() => ({}));
    const recipient = typeof body.recipient === "string" ? body.recipient : "";
    const occasion = typeof body.occasion === "string" ? body.occasion : "";
    const parentSessionId =
      typeof body.parentSessionId === "string" && isValidSessionId(body.parentSessionId)
        ? body.parentSessionId
        : null;
    const compassSelections =
      body.compassSelections && typeof body.compassSelections === "object"
        ? body.compassSelections
        : null;

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          String(m.content || "").trim().length > 0
      )
      .map((m) => ({
        role: m.role,
        content: String(m.content).trim(),
        hidden: Boolean(m.hidden),
      }));

    const id = await createGiftSession({
      recipient,
      occasion,
      parentSessionId,
      compassSelections,
    });

    if (!id) {
      return NextResponse.json({ id: null, persistence: "off" });
    }

    if (messages.length > 0) {
      await seedSessionMessages(id, messages);
    }

    return NextResponse.json({ id, persistence: "supabase" });
  } catch (err) {
    console.error("[GiftMind] POST /api/session:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Session create failed" },
      { status: 500 }
    );
  }
}
