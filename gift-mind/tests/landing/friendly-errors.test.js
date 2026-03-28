import { describe, it, expect } from "vitest";

import { friendlyChatError } from "@/lib/friendly-errors.js";

describe("friendlyChatError", () => {
  it("handles network-style failures", () => {
    expect(friendlyChatError(new Error("Failed to fetch"), "stream")).toContain(
      "connection"
    );
    expect(friendlyChatError(new Error("Failed to fetch"), "synthesize")).toContain(
      "direction"
    );
  });

  it("handles auth / key hints", () => {
    const msg = friendlyChatError(new Error("401 Invalid API Key"), "stream");
    expect(msg).toMatch(/authorize|API key|\.env/i);
  });

  it("handles rate limit / 429 style messages", () => {
    expect(friendlyChatError(new Error("Request failed (429)"), "stream")).toMatch(
      /usage limit/i
    );
    expect(friendlyChatError(new Error("GiftMind hit usage limit"), "synthesize")).toMatch(
      /Generate/i
    );
  });

  it("falls back to message or default", () => {
    expect(friendlyChatError(new Error("Custom problem"), "stream")).toBe(
      "Custom problem"
    );
    expect(friendlyChatError(null, "stream")).toMatch(/try again/i);
  });
});
