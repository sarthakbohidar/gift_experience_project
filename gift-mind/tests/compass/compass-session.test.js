import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GIFTMIND_DIRECTION_KEY,
  GIFTMIND_CHAT_BOOTSTRAP_KEY,
  buildCompassGenerateBody,
  isCompassSelectionComplete,
  readDirectionFromSession,
  writeDirectionToSession,
  clearDirectionFromSession,
  writeChatBootstrapToSession,
  readAndClearChatBootstrapFromSession,
  peekChatBootstrapFromSession,
  clearChatBootstrapFromSession,
} from "@/lib/compass-session.js";

describe("buildCompassGenerateBody", () => {
  it("maps fork ids to API shape", () => {
    expect(
      buildCompassGenerateBody({
        step0_recipient: "parent",
        step1_occasion: "birthday",
        step2_experience: "solo",
        step3_vibe: "daily_special",
        step4_nature: "elevated",
        step5_practical: "sentimental",
      })
    ).toEqual({
      recipient: "parent",
      occasion: "birthday",
      forks: {
        step2_experience: "solo",
        step3_vibe: "daily_special",
        step4_nature: "elevated",
        step5_practical: "sentimental",
      },
    });
  });

  it("handles empty / partial selections", () => {
    const body = buildCompassGenerateBody({});
    expect(body.recipient).toBeUndefined();
    expect(body.forks.step2_experience).toBeUndefined();
  });
});

describe("isCompassSelectionComplete", () => {
  it("requires all six fork values as non-empty strings", () => {
    expect(isCompassSelectionComplete({})).toBe(false);
    expect(
      isCompassSelectionComplete({
        step0_recipient: "p",
        step1_occasion: "b",
        step2_experience: "x",
        step3_vibe: "y",
        step4_nature: "z",
        step5_practical: "",
      })
    ).toBe(false);
    expect(
      isCompassSelectionComplete({
        step0_recipient: "parent",
        step1_occasion: "birthday",
        step2_experience: "solo",
        step3_vibe: "daily_special",
        step4_nature: "elevated",
        step5_practical: "sentimental",
      })
    ).toBe(true);
  });
});

describe("session helpers (browser)", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const mem = new Map();
    globalThis.window = {
      sessionStorage: {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => void mem.set(k, String(v)),
        removeItem: (k) => void mem.delete(k),
      },
    };
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  it("uses GIFTMIND_DIRECTION_KEY constant", () => {
    expect(GIFTMIND_DIRECTION_KEY).toBe("giftmind_direction");
  });

  it("writeDirectionToSession + readDirectionFromSession roundtrip", () => {
    const payload = {
      direction: { headline: "H" },
      where_to_look: [{ name: "A" }],
      recipient: "parent",
      occasion: "birthday",
    };
    writeDirectionToSession(payload);
    expect(readDirectionFromSession()).toEqual(payload);
  });

  it("readDirectionFromSession returns null for invalid JSON", () => {
    globalThis.window.sessionStorage.setItem(GIFTMIND_DIRECTION_KEY, "{bad");
    expect(readDirectionFromSession()).toBeNull();
  });

  it("readDirectionFromSession returns null when direction missing", () => {
    globalThis.window.sessionStorage.setItem(
      GIFTMIND_DIRECTION_KEY,
      JSON.stringify({ where_to_look: [] })
    );
    expect(readDirectionFromSession()).toBeNull();
  });

  it("clearDirectionFromSession removes key", () => {
    writeDirectionToSession({ direction: { headline: "x" }, where_to_look: [] });
    clearDirectionFromSession();
    expect(readDirectionFromSession()).toBeNull();
  });

  it("writeChatBootstrapToSession + readAndClearChatBootstrapFromSession roundtrip", () => {
    const boot = {
      recipient: "partner",
      occasion: "birthday",
      initialMessages: [{ role: "assistant", content: "Hi", streaming: false }],
    };
    writeChatBootstrapToSession(boot);
    expect(readAndClearChatBootstrapFromSession()).toEqual(boot);
    expect(globalThis.window.sessionStorage.getItem(GIFTMIND_CHAT_BOOTSTRAP_KEY)).toBeNull();
  });

  it("readAndClearChatBootstrapFromSession returns null for invalid payload", () => {
    globalThis.window.sessionStorage.setItem(
      GIFTMIND_CHAT_BOOTSTRAP_KEY,
      JSON.stringify({ recipient: "p", occasion: "b", initialMessages: [] })
    );
    expect(readAndClearChatBootstrapFromSession()).toBeNull();
  });

  it("peekChatBootstrapFromSession does not remove key; clearChatBootstrapFromSession does", () => {
    const boot = {
      recipient: "partner",
      occasion: "birthday",
      initialMessages: [{ role: "assistant", content: "Hi" }],
    };
    writeChatBootstrapToSession(boot);
    expect(peekChatBootstrapFromSession()).toEqual(boot);
    expect(globalThis.window.sessionStorage.getItem(GIFTMIND_CHAT_BOOTSTRAP_KEY)).not.toBeNull();
    clearChatBootstrapFromSession();
    expect(peekChatBootstrapFromSession()).toBeNull();
  });
});

describe("session helpers without window", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("readDirectionFromSession returns null", () => {
    delete globalThis.window;
    expect(readDirectionFromSession()).toBeNull();
  });

  it("write and clear are no-ops", () => {
    delete globalThis.window;
    expect(() =>
      writeDirectionToSession({ direction: {}, where_to_look: [] })
    ).not.toThrow();
    expect(() => clearDirectionFromSession()).not.toThrow();
  });
});
