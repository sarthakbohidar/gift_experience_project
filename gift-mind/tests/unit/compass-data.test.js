import { describe, it, expect } from "vitest";
import { compassForks, labelForForkSelection } from "../../src/lib/compass-data.js";

const EXPECTED_IDS = [
  "step0_recipient",
  "step1_occasion",
  "step2_experience",
  "step3_vibe",
  "step4_nature",
  "step5_practical",
];

describe("compassForks", () => {
  it("has exactly 6 forks", () => {
    expect(compassForks).toHaveLength(6);
  });

  it("uses stable ids in order (API / prompt alignment)", () => {
    expect(compassForks.map((f) => f.id)).toEqual(EXPECTED_IDS);
  });

  it("has unique fork ids", () => {
    const ids = compassForks.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each fork has question and non-empty options", () => {
    for (const fork of compassForks) {
      expect(fork.question, fork.id).toBeTruthy();
      expect(typeof fork.question).toBe("string");
      expect(fork.options.length).toBeGreaterThan(0);
    }
  });

  it("step0 and step1 include subtitle; later steps may omit it", () => {
    expect(compassForks[0].subtitle).toBeTruthy();
    expect(compassForks[1].subtitle).toBeTruthy();
    for (let i = 2; i < compassForks.length; i++) {
      expect(
        "subtitle" in compassForks[i],
        `${compassForks[i].id} should not accidentally add subtitle without spec`
      ).toBe(false);
    }
  });

  it("each option has label, value, emoji as non-empty strings", () => {
    for (const fork of compassForks) {
      for (const opt of fork.options) {
        expect(opt.label?.trim(), fork.id).toBeTruthy();
        expect(opt.value?.trim(), fork.id).toBeTruthy();
        expect(opt.emoji?.trim(), fork.id).toBeTruthy();
      }
    }
  });

  it("option values are unique within each fork (no ambiguous selection)", () => {
    for (const fork of compassForks) {
      const values = fork.options.map((o) => o.value);
      expect(new Set(values).size, fork.id).toBe(values.length);
    }
  });

  it("recipient and occasion option values cover API contract (sample)", () => {
    const recipientValues = compassForks[0].options.map((o) => o.value);
    expect(recipientValues).toContain("partner");
    expect(recipientValues).toContain("parent");

    const occasionValues = compassForks[1].options.map((o) => o.value);
    expect(occasionValues).toContain("birthday");
    expect(occasionValues).toContain("festival");
  });

  it("forks step2–step5 values match COMPASS_PROMPT_TEMPLATE keys", () => {
    const step2 = compassForks[2].options.map((o) => o.value);
    expect(step2).toEqual(["together", "solo", "surprise"]);

    const step3 = compassForks[3].options.map((o) => o.value);
    expect(step3).toEqual(["daily_special", "milestone_memory", "unexpected"]);

    const step4 = compassForks[4].options.map((o) => o.value);
    expect(step4).toEqual(["new_experience", "elevated", "handmade_personal"]);

    const step5 = compassForks[5].options.map((o) => o.value);
    expect(step5).toEqual(["practical", "sentimental", "both"]);
  });
});

describe("labelForForkSelection", () => {
  it("returns option label for known fork and value", () => {
    expect(labelForForkSelection("step0_recipient", "partner")).toBe("Partner / Spouse");
    expect(labelForForkSelection("step2_experience", "together")).toBe(
      "An experience we share together"
    );
  });

  it("falls back for unknown fork or value", () => {
    expect(labelForForkSelection("unknown_fork", "x")).toBe("x");
    expect(labelForForkSelection("step0_recipient", "nope")).toBe("nope");
  });
});
