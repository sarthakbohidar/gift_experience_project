import { describe, it, expect } from "vitest";

import {
  parseChatSseLine,
  extractSseEvents,
  detectSynthesisReady,
  shouldOfferSynthesizeFromAssistantMessage,
  defaultChatContextFromParams,
  buildInitialAssistantContent,
} from "@/lib/chat-stream.js";

describe("parseChatSseLine", () => {
  it("returns text event for JSON payload", () => {
    expect(parseChatSseLine('data: {"text":"hello"}')).toEqual({
      type: "text",
      text: "hello",
    });
  });

  it("returns done for [DONE]", () => {
    expect(parseChatSseLine("data: [DONE]")).toEqual({ type: "done" });
  });

  it("returns null for non-data lines and invalid JSON", () => {
    expect(parseChatSseLine("event: ping")).toBeNull();
    expect(parseChatSseLine('data: {bad')).toBeNull();
    expect(parseChatSseLine("")).toBeNull();
  });
});

describe("extractSseEvents", () => {
  it("parses complete events and keeps remainder", () => {
    const buf =
      'data: {"text":"a"}\n\ndata: {"text":"b"}\n\nleft';
    const { events, rest } = extractSseEvents(buf);
    expect(events).toEqual([
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ]);
    expect(rest).toBe("left");
  });

  it("handles multiline blocks and [DONE]", () => {
    const { events, rest } = extractSseEvents('data: [DONE]\n\n');
    expect(events).toEqual([{ type: "done" }]);
    expect(rest).toBe("");
  });
});

describe("detectSynthesisReady", () => {
  it("is true for prompt-aligned phrases", () => {
    expect(detectSynthesisReady("I think I have a really clear picture now.")).toBe(
      true
    );
    expect(
      detectSynthesisReady("Let me put together something special for you.")
    ).toBe(true);
    expect(detectSynthesisReady("I have something special for you.")).toBe(true);
  });

  it("is false for unrelated or suggestive text (no false Generate CTA)", () => {
    expect(detectSynthesisReady("What is their favorite color?")).toBe(false);
    expect(detectSynthesisReady("")).toBe(false);
    expect(detectSynthesisReady("Something special is waiting.")).toBe(false);
    expect(
      detectSynthesisReady("Maybe get them something special for Diwali?")
    ).toBe(false);
  });

  it("detects let me craft", () => {
    expect(detectSynthesisReady("Let me craft your direction now.")).toBe(true);
  });
});

describe("shouldOfferSynthesizeFromAssistantMessage", () => {
  it("is true for hand-off phrases", () => {
    expect(shouldOfferSynthesizeFromAssistantMessage("Let me craft your direction.")).toBe(
      true
    );
  });

  it("is true when model leaked direction JSON", () => {
    const leaked = JSON.stringify({
      direction: {
        headline: "A pottery class voucher",
        detail: "Book a weekend slot",
        why_it_resonates: "They love clay",
        gift_story: "For your hands that shape joy",
        category: "default",
      },
    });
    expect(shouldOfferSynthesizeFromAssistantMessage(leaked)).toBe(true);
  });
});

describe("defaultChatContextFromParams", () => {
  it("trims and falls back when empty", () => {
    expect(defaultChatContextFromParams("  ", "")).toEqual({
      recipient: "someone you care about",
      occasion: "this moment",
    });
    expect(defaultChatContextFromParams("Mom", " Diwali ")).toEqual({
      recipient: "Mom",
      occasion: "Diwali",
    });
  });
});

describe("buildInitialAssistantContent", () => {
  it("mentions both params when present", () => {
    const s = buildInitialAssistantContent("parent", "birthday");
    expect(s).toMatch(/mom or dad|birthday/i);
  });

  it("uses warm greeting when params missing", () => {
    expect(buildInitialAssistantContent("", "")).toMatch(/Hey|gift/i);
  });
});
