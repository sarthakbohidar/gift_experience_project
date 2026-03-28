import { describe, it, expect } from "vitest";

import {
  parseDirectionFromLlmContent,
  assistantMessageContainsParsableDirection,
} from "@/lib/parse-direction-json.js";

const minimalDirection = {
  direction: {
    headline: "H",
    detail: "D",
    why_it_resonates: "W",
    gift_story: "S",
    category: "default",
  },
};

describe("parseDirectionFromLlmContent", () => {
  it("parses fenced JSON", () => {
    const raw = "```json\n" + JSON.stringify(minimalDirection) + "\n```";
    const o = parseDirectionFromLlmContent(raw);
    expect(o.direction.headline).toBe("H");
  });

  it("extracts JSON after leading prose", () => {
    const inner = JSON.stringify(minimalDirection);
    const raw = `Here you go:\n${inner}\nHope this helps!`;
    const o = parseDirectionFromLlmContent(raw);
    expect(o.direction.category).toBe("default");
  });

  it("throws when no valid direction object", () => {
    expect(() => parseDirectionFromLlmContent("{bad")).toThrow();
  });
});

describe("assistantMessageContainsParsableDirection", () => {
  it("is true for streamed direction-shaped JSON", () => {
    const raw = JSON.stringify(minimalDirection);
    expect(assistantMessageContainsParsableDirection(raw)).toBe(true);
  });

  it("is false for normal chat prose", () => {
    expect(
      assistantMessageContainsParsableDirection(
        "What’s one small ritual they never skip on a weekday morning?"
      )
    ).toBe(false);
  });
});
