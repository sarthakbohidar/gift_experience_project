import { describe, it, expect } from "vitest";
import { whereToLookMap } from "../../src/lib/where-to-look.js";

/** Must stay aligned with CORE_SYSTEM_PROMPT category enum in prompts.js */
const REQUIRED_CATEGORIES = [
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

describe("whereToLookMap", () => {
  it("defines every category the LLM is instructed to emit, plus default", () => {
    for (const key of REQUIRED_CATEGORIES) {
      expect(whereToLookMap[key], `missing map key: ${key}`).toBeDefined();
    }
  });

  it("has no extra top-level keys beyond the contract (catch typos / drift)", () => {
    expect(Object.keys(whereToLookMap).sort()).toEqual(
      [...REQUIRED_CATEGORIES].sort()
    );
  });

  it("each category lists exactly three suggestions", () => {
    for (const key of REQUIRED_CATEGORIES) {
      const list = whereToLookMap[key];
      expect(list, key).toHaveLength(3);
    }
  });

  it("each entry has name and type; url is string or null", () => {
    for (const key of REQUIRED_CATEGORIES) {
      for (const entry of whereToLookMap[key]) {
        expect(entry.name?.trim(), `${key}.name`).toBeTruthy();
        expect(entry.type?.trim(), `${key}.type`).toBeTruthy();
        const { url } = entry;
        expect(
          url === null || typeof url === "string",
          `${key} ${entry.name} url`
        ).toBe(true);
        if (typeof url === "string") {
          expect(url.startsWith("http"), entry.name).toBe(true);
        }
      }
    }
  });

  it("offline hints use null url", () => {
    const offline = whereToLookMap.experience_together.find((e) =>
      e.name.includes("local")
    );
    expect(offline?.url).toBeNull();
  });

  it("default category is a safe fallback bucket", () => {
    expect(whereToLookMap.default.map((e) => e.name)).toContain("Amazon India");
  });
});
