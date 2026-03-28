import { NextResponse } from "next/server";

import { groq } from "@/lib/groq.js";
import { groqErrorToHttpResponse } from "@/lib/groq-errors.js";
import { defaultChatContextFromParams } from "@/lib/chat-stream.js";
import { CORE_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from "@/lib/prompts.js";
import { isSupabaseConfigured } from "@/lib/supabase-admin.js";
import {
  appendSessionMessage,
  fetchMessagesForModel,
  isValidSessionId,
  touchGiftSession,
} from "@/lib/gift-sessions.js";

function buildGroqMessagesFromHistory(history, r, o) {
  const contextNote = `\n\nContext: The giver is thinking about ${r}, for ${o}. Use this naturally; do not repeat it mechanically every turn.`;
  const chatModeFence =
    "\n\nACTIVE_MODE: CONVERSATION — Reply in plain text only. Ignore the JSON OUTPUT FORMAT block above for this thread; the app runs synthesis separately when the user taps Generate. Never paste direction JSON here.\n";
  return [
    {
      role: "system",
      content: CORE_SYSTEM_PROMPT + chatModeFence + CHAT_SYSTEM_PROMPT + contextNote,
    },
    ...history.map(({ role, content }) => ({ role, content })),
  ];
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages: clientMessages,
      recipient,
      occasion,
      sessionId: rawSessionId,
      userMessage: rawUserMessage,
    } = body || {};

    const { recipient: r, occasion: o } = defaultChatContextFromParams(
      typeof recipient === "string" ? recipient : "",
      typeof occasion === "string" ? occasion : ""
    );

    const useDb =
      isSupabaseConfigured() &&
      typeof rawSessionId === "string" &&
      isValidSessionId(rawSessionId) &&
      typeof rawUserMessage === "string" &&
      rawUserMessage.trim().length > 0;

    let groqMessages;

    if (useDb) {
      const prior = await fetchMessagesForModel(rawSessionId);
      const historyForGroq = prior.map(({ role, content }) => ({ role, content }));
      const userText = rawUserMessage.trim();
      groqMessages = buildGroqMessagesFromHistory(
        [...historyForGroq, { role: "user", content: userText }],
        r,
        o
      );
    } else {
      groqMessages = buildGroqMessagesFromHistory(
        Array.isArray(clientMessages) ? clientMessages : [],
        r,
        o
      );
    }

    let response;
    try {
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.8,
        max_tokens: 1024,
        stream: true,
      });
    } catch (groqErr) {
      const { status, error } = groqErrorToHttpResponse(groqErr);
      return NextResponse.json({ error }, { status });
    }

    const persistSessionId = useDb ? rawSessionId : null;
    const persistUserText = useDb ? rawUserMessage.trim() : null;

    const stream = new ReadableStream({
      async start(controller) {
        let accumulated = "";
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              accumulated += text;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          if (persistSessionId && persistUserText) {
            await appendSessionMessage(persistSessionId, {
              role: "user",
              content: persistUserText,
              hidden: false,
            });
            await appendSessionMessage(persistSessionId, {
              role: "assistant",
              content: accumulated,
              hidden: false,
            });
            await touchGiftSession(persistSessionId);
          }

          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          try {
            controller.error(err);
          } catch {
            // ignore
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const { status, error } = groqErrorToHttpResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
