import { NextResponse } from "next/server";

import { generateCompletion } from "@/lib/groq.js";
import { groqErrorToHttpResponse } from "@/lib/groq-errors.js";
import { CORE_SYSTEM_PROMPT, COMPASS_PROMPT_TEMPLATE } from "@/lib/prompts.js";
import { whereToLookMap } from "@/lib/where-to-look.js";

function stripJsonFences(text) {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { recipient, occasion, forks } = body || {};

    const messages = [
      { role: "system", content: CORE_SYSTEM_PROMPT },
      {
        role: "user",
        content: COMPASS_PROMPT_TEMPLATE(recipient, occasion, forks || {}),
      },
    ];

    const response = await generateCompletion(messages, false);
    const text = response?.choices?.[0]?.message?.content || "";
    const cleaned = stripJsonFences(text);
    const parsed = JSON.parse(cleaned);

    const category = parsed?.direction?.category || "default";
    const whereToLook = whereToLookMap[category] || whereToLookMap.default;

    return NextResponse.json({
      direction: parsed.direction,
      where_to_look: whereToLook,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "The AI returned something we couldn’t parse. Please try generating again.",
        },
        { status: 502 }
      );
    }
    const { status, error } = groqErrorToHttpResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

