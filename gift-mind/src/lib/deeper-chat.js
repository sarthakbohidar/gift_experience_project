import { compassForks, labelForForkSelection } from "@/lib/compass-data.js";

const FORK_IDS_FOR_CONTEXT = [
  "step2_experience",
  "step3_vibe",
  "step4_nature",
  "step5_practical",
];

function occasionDisplay(o) {
  const s = typeof o === "string" ? o.trim() : "";
  if (!s) return "";
  return s.replace(/_/g, " ");
}

function recipientDisplay(r) {
  const s = typeof r === "string" ? r.trim() : "";
  if (!s) return "";
  const map = {
    partner: "partner",
    parent: "mom or dad",
    sibling: "sibling",
    friend: "close friend",
    acquaintance: "someone you don't know well yet",
  };
  return map[s] || s;
}

function compassLinesFromSelections(selections) {
  const s = selections && typeof selections === "object" ? selections : {};
  return FORK_IDS_FOR_CONTEXT.map((id) => {
    const fork = compassForks.find((f) => f.id === id);
    const q = fork?.question || id;
    const label = labelForForkSelection(id, s[id]);
    return `- ${q} → ${label}`;
  }).join("\n");
}

function hiddenCompassContextUserMessage(payload) {
  const r = typeof payload.recipient === "string" ? payload.recipient : "";
  const o = typeof payload.occasion === "string" ? payload.occasion : "";
  const dir = payload.direction && typeof payload.direction === "object" ? payload.direction : {};
  const headline = typeof dir.headline === "string" ? dir.headline : "";
  const detail = typeof dir.detail === "string" ? dir.detail : "";
  const why = typeof dir.why_it_resonates === "string" ? dir.why_it_resonates : "";
  const selections = payload.compass_selections;
  const forkBlock =
    selections && typeof selections === "object"
      ? compassLinesFromSelections(selections)
      : "(Compass fork choices were not stored; use recipient, occasion, and direction below.)";

  return [
    "[Background from Gift Compass — user tapped “Go deeper”. Do not ask them to repeat this; build on it with one new question at a time.]",
    `Recipient (param): ${r || "—"}`,
    `Occasion (param): ${o || "—"}`,
    "Their compass choices:",
    forkBlock,
    "",
    "Direction they received:",
    headline ? `- Headline: ${headline}` : "",
    detail ? `- Detail: ${detail}` : "",
    why ? `- Why it resonates: ${why}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function visibleCompassOpener(payload) {
  const who = recipientDisplay(payload.recipient);
  const when = occasionDisplay(payload.occasion);
  const dir = payload.direction && typeof payload.direction === "object" ? payload.direction : {};
  const headline = typeof dir.headline === "string" ? dir.headline.trim() : "";
  const selections = payload.compass_selections;
  let choicesBit = "";
  if (selections && typeof selections === "object") {
    const bits = FORK_IDS_FOR_CONTEXT.map((id) => labelForForkSelection(id, selections[id]))
      .filter(Boolean)
      .slice(0, 4);
    if (bits.length) choicesBit = ` You already shaped this around ${bits.join(", ").toLowerCase()}.`;
  }
  const dirBit = headline ? ` Your compass direction was “${headline}”.` : "";

  return (
    `Picking up right where Gift Compass left off — ${who}, ${when}.${choicesBit}${dirBit} ` +
    `I still have all of that context; we’re not starting over. ` +
    `What’s one thing they’ve mentioned wanting to try, learn, or fix in the last year — even in passing?`
  );
}

function lastUserSnippet(transcript) {
  const t = Array.isArray(transcript) ? transcript : [];
  for (let i = t.length - 1; i >= 0; i--) {
    const m = t[i];
    if (m?.role === "user" && typeof m.content === "string") {
      const c = m.content.trim();
      if (c.length > 220) return `${c.slice(0, 217)}…`;
      return c;
    }
  }
  return "";
}

function hiddenPriorChatSummaryOnly(payload) {
  const r = typeof payload.recipient === "string" ? payload.recipient : "";
  const o = typeof payload.occasion === "string" ? payload.occasion : "";
  const dir = payload.direction && typeof payload.direction === "object" ? payload.direction : {};
  const headline = typeof dir.headline === "string" ? dir.headline : "";
  const detail = typeof dir.detail === "string" ? dir.detail : "";

  return [
    "[Background — user finished a GiftMind chat and tapped “Go deeper”. Transcript was not stored; use direction + context only.]",
    `Recipient (param): ${r}`,
    `Occasion (param): ${o}`,
    headline ? `Synthesized direction headline: ${headline}` : "",
    detail ? `Detail: ${detail}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function visibleChatOpener(payload) {
  const dir = payload.direction && typeof payload.direction === "object" ? payload.direction : {};
  const headline = typeof dir.headline === "string" ? dir.headline.trim() : "";
  const snippet = lastUserSnippet(payload.chat_transcript);
  const recall = snippet
    ? ` You last shared: “${snippet}” — I’m holding onto that.`
    : "";

  const dirPart = headline
    ? `We already shaped “${headline}” together — I’m carrying the full chat in mind, not re-asking the basics.${recall}`
    : `I’m continuing our last conversation — same thread, new layer.${recall}`;

  return (
    `${dirPart} ` +
    `Next beat only: if you could give them one gift that fixes a small daily annoyance they joke or vent about, what would it be?`
  );
}

/** @param {Record<string, unknown> | null | undefined} payload */
export function buildCompassGoDeeperBootstrap(payload) {
  if (!payload?.direction || typeof payload.recipient !== "string" || typeof payload.occasion !== "string") {
    return null;
  }
  return {
    recipient: payload.recipient,
    occasion: payload.occasion,
    initialMessages: [
      { role: "user", content: hiddenCompassContextUserMessage(payload), hidden: true },
      { role: "assistant", content: visibleCompassOpener(payload), streaming: false, hidden: false },
    ],
  };
}

/** @param {Record<string, unknown> | null | undefined} payload */
export function buildChatGoDeeperBootstrap(payload) {
  if (!payload?.direction || typeof payload.recipient !== "string" || typeof payload.occasion !== "string") {
    return null;
  }
  const transcript = Array.isArray(payload.chat_transcript) ? payload.chat_transcript : [];

  /** @type {Array<{ role: string, content: string, hidden?: boolean }>} */
  const hiddenMessages =
    transcript.length > 0
      ? [
          ...transcript
            .filter(
              (m) =>
                (m.role === "user" || m.role === "assistant") && String(m.content || "").trim()
            )
            .map((m) => ({ role: m.role, content: String(m.content).trim(), hidden: true })),
          {
            role: "user",
            content:
              "[User opened “Go deeper” from their direction card. Use the full thread above as memory. Ask one net-new follow-up — do not repeat earlier questions verbatim.]",
            hidden: true,
          },
        ]
      : [{ role: "user", content: hiddenPriorChatSummaryOnly(payload), hidden: true }];

  return {
    recipient: payload.recipient,
    occasion: payload.occasion,
    initialMessages: [
      ...hiddenMessages,
      { role: "assistant", content: visibleChatOpener(payload), streaming: false, hidden: false },
    ],
  };
}
