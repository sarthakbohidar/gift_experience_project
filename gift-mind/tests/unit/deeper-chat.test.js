import { describe, it, expect } from "vitest";
import {
  buildCompassGoDeeperBootstrap,
  buildChatGoDeeperBootstrap,
} from "../../src/lib/deeper-chat.js";

describe("buildCompassGoDeeperBootstrap", () => {
  it("returns null without direction or recipient/occasion", () => {
    expect(buildCompassGoDeeperBootstrap(null)).toBeNull();
    expect(buildCompassGoDeeperBootstrap({ recipient: "p", occasion: "b" })).toBeNull();
  });

  it("builds hidden compass context and a visible opener", () => {
    const payload = {
      recipient: "partner",
      occasion: "birthday",
      compass_selections: {
        step2_experience: "together",
        step3_vibe: "daily_special",
        step4_nature: "elevated",
        step5_practical: "sentimental",
      },
      direction: {
        headline: "Weekend pottery for two",
        detail: "Book a class",
        why_it_resonates: "They love making things together",
      },
      where_to_look: [],
    };
    const boot = buildCompassGoDeeperBootstrap(payload);
    expect(boot).not.toBeNull();
    expect(boot.recipient).toBe("partner");
    expect(boot.occasion).toBe("birthday");
    expect(boot.initialMessages).toHaveLength(2);
    expect(boot.initialMessages[0].role).toBe("user");
    expect(boot.initialMessages[0].hidden).toBe(true);
    expect(boot.initialMessages[0].content).toContain("Gift Compass");
    expect(boot.initialMessages[0].content).toContain("Weekend pottery for two");
    expect(boot.initialMessages[1].role).toBe("assistant");
    expect(boot.initialMessages[1].hidden).not.toBe(true);
    expect(boot.initialMessages[1].content).toContain("Weekend pottery for two");
    expect(boot.initialMessages[1].content).toContain("not starting over");
  });
});

describe("buildChatGoDeeperBootstrap", () => {
  it("returns null without direction", () => {
    expect(buildChatGoDeeperBootstrap({ recipient: "p", occasion: "b" })).toBeNull();
  });

  it("embeds full transcript as hidden then a new opener", () => {
    const payload = {
      recipient: "friend",
      occasion: "festival",
      direction: { headline: "Spice box set" },
      chat_transcript: [
        { role: "assistant", content: "What do they love cooking?" },
        { role: "user", content: "South Indian breakfasts every Sunday." },
      ],
    };
    const boot = buildChatGoDeeperBootstrap(payload);
    const userTurn = boot.initialMessages.find((m) => m.role === "user" && m.hidden);
    expect(userTurn?.content).toContain("South Indian");
    const last = boot.initialMessages[boot.initialMessages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.content).toContain("Spice box set");
    expect(last.content).toContain("South Indian breakfasts");
    expect(last.content).toContain("full chat");
  });

  it("uses summary-only hidden message when transcript missing", () => {
    const payload = {
      recipient: "sibling",
      occasion: "birthday",
      direction: { headline: "H", detail: "D" },
    };
    const boot = buildChatGoDeeperBootstrap(payload);
    expect(boot.initialMessages).toHaveLength(2);
    expect(boot.initialMessages[0].hidden).toBe(true);
    expect(boot.initialMessages[0].content).toContain("Transcript was not stored");
  });
});
