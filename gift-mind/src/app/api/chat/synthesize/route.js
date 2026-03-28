import { NextResponse } from "next/server";

import { generateCompletion } from "@/lib/groq.js";
import { groqErrorToHttpResponse } from "@/lib/groq-errors.js";
import { defaultChatContextFromParams } from "@/lib/chat-stream.js";
import { parseDirectionFromLlmContent } from "@/lib/parse-direction-json.js";
import { CORE_SYSTEM_PROMPT, SYNTHESIS_PROMPT } from "@/lib/prompts.js";
import { whereToLookMap } from "@/lib/where-to-look.js";
import { isSupabaseConfigured } from "@/lib/supabase-admin.js";
import {
  fetchMessagesForModel,
  isValidSessionId,
  updateGiftSession,
} from "@/lib/gift-sessions.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages: clientMessages,
      recipient,
      occasion,
      sessionId: rawSessionId,
      compassSelections: bodyCompass,
    } = body || {};

    const { recipient: r, occasion: o } = defaultChatContextFromParams(
      typeof recipient === "string" ? recipient : "",
      typeof occasion === "string" ? occasion : ""
    );
    const contextNote = `\n\nContext: Gifting for ${r}, occasion: ${o}.`;

    let conversationMessages = Array.isArray(clientMessages) ? clientMessages : [];

    const useDb =
      isSupabaseConfigured() &&
      typeof rawSessionId === "string" &&
      isValidSessionId(rawSessionId);

    if (useDb) {
      const rows = await fetchMessagesForModel(rawSessionId);
      conversationMessages = rows.map(({ role, content }) => ({ role, content }));
    }

    const groqMessages = [
      {
        role: "system",
        content: CORE_SYSTEM_PROMPT + "\n\n" + SYNTHESIS_PROMPT + contextNote,
      },
      ...conversationMessages,
    ];

    const response = await generateCompletion(groqMessages, false);
    const text = response?.choices?.[0]?.message?.content || "";
    const parsed = parseDirectionFromLlmContent(text);

    const category = parsed?.direction?.category || "default";
    const whereToLook = whereToLookMap[category] || whereToLookMap.default;

    if (useDb && parsed?.direction) {
      const compassPatch =
        bodyCompass && typeof bodyCompass === "object" ? bodyCompass : undefined;
      await updateGiftSession(rawSessionId, {
        recipient: r,
        occasion: o,
        lastDirection: parsed.direction,
        whereToLook,
        ...(compassPatch !== undefined ? { compassSelections: compassPatch } : {}),
      });
    }

    return NextResponse.json({
      direction: parsed.direction,
      where_to_look: whereToLook,
    });
  } catch (err) {
    const { status, error } = groqErrorToHttpResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
