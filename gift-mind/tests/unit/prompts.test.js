import { describe, it, expect } from "vitest";
import {
  CORE_SYSTEM_PROMPT,
  COMPASS_PROMPT_TEMPLATE,
  CHAT_SYSTEM_PROMPT,
  SYNTHESIS_PROMPT,
} from "../../src/lib/prompts.js";

describe("prompt exports", () => {
  it("exports all four prompt symbols as non-empty strings", () => {
    expect(CORE_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(typeof COMPASS_PROMPT_TEMPLATE).toBe("function");
    expect(CHAT_SYSTEM_PROMPT.length).toBeGreaterThan(50);
    expect(SYNTHESIS_PROMPT.length).toBeGreaterThan(50);
  });
});

describe("CORE_SYSTEM_PROMPT", () => {
  it("mentions JSON-only output and direction shape", () => {
    expect(CORE_SYSTEM_PROMPT).toContain('"direction"');
    expect(CORE_SYSTEM_PROMPT).toContain("headline");
    expect(CORE_SYSTEM_PROMPT).toContain("why_it_resonates");
    expect(CORE_SYSTEM_PROMPT).toContain("gift_story");
    expect(CORE_SYSTEM_PROMPT).toContain("category");
  });

  it("lists every where-to-look category slug for the model", () => {
    const slugs = [
      "experience_together",
      "artisan_handmade",
      "stationery_artisan",
      "food_gourmet",
      "home_decor",
      "wellness_selfcare",
      "books_learning",
      "tech_gadget",
      "plants_garden",
      "fashion_accessories",
      "default",
    ];
    for (const s of slugs) {
      expect(CORE_SYSTEM_PROMPT).toContain(s);
    }
  });
});

describe("COMPASS_PROMPT_TEMPLATE", () => {
  it("interpolates recipient and occasion", () => {
    const out = COMPASS_PROMPT_TEMPLATE("parent", "birthday", {
      step2_experience: "solo",
      step3_vibe: "daily_special",
      step4_nature: "elevated",
      step5_practical: "sentimental",
    });
    expect(out).toContain("Recipient: parent");
    expect(out).toContain("Occasion: birthday");
    expect(out).toContain("Experience preference: solo");
    expect(out).toContain("Gift vibe: daily_special");
    expect(out).toContain("Gift nature: elevated");
    expect(out).toContain("Practical vs sentimental: sentimental");
  });

  it("uses 'not specified' for missing fork keys", () => {
    const out = COMPASS_PROMPT_TEMPLATE("friend", "festival", {});
    expect(out).toContain("Experience preference: not specified");
    expect(out).toContain("Gift vibe: not specified");
    expect(out).toContain("Gift nature: not specified");
    expect(out).toContain("Practical vs sentimental: not specified");
  });

  it("uses 'not specified' when fork keys are null or undefined", () => {
    const out = COMPASS_PROMPT_TEMPLATE("a", "b", {
      step2_experience: null,
      step3_vibe: undefined,
      step4_nature: "",
      step5_practical: "practical",
    });
    expect(out).toContain("Experience preference: not specified");
    expect(out).toContain("Gift vibe: not specified");
    expect(out).toContain("Gift nature: not specified");
    expect(out).toContain("Practical vs sentimental: practical");
  });

  it("documents string coercion for odd recipient/occasion inputs", () => {
    expect(COMPASS_PROMPT_TEMPLATE(undefined, null, {}).split("\n")[1]).toContain(
      "Recipient: undefined"
    );
    expect(COMPASS_PROMPT_TEMPLATE(undefined, null, {}).split("\n")[2]).toContain(
      "Occasion: null"
    );
  });
});

describe("CHAT_SYSTEM_PROMPT", () => {
  it("includes generate-button signal phrase for the model", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("clear picture now");
    expect(CHAT_SYSTEM_PROMPT).toContain("put together something special");
  });

  it("mentions go-deeper background handling", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("Go deeper");
  });

  it("forbids JSON direction output in chat", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("NEVER output JSON");
  });
});

describe("SYNTHESIS_PROMPT", () => {
  it("requires JSON-only direction output", () => {
    expect(SYNTHESIS_PROMPT.toLowerCase()).toContain("json");
    expect(SYNTHESIS_PROMPT).toContain("why_it_resonates");
  });
});
