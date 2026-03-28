import { describe, it, expect } from "vitest";

import {
  EXPERIENCE_PATHS,
  LANDING_BRAND,
  LANDING_HERO,
} from "@/components/landing/landing-content.js";

describe("landing-content", () => {
  it("defines brand and hero strings", () => {
    expect(LANDING_BRAND).toBe("GiftMind");
    expect(LANDING_HERO.title.length).toBeGreaterThan(10);
    expect(LANDING_HERO.description.length).toBeGreaterThan(20);
  });

  it("maps architecture flows to routes", () => {
    expect(EXPERIENCE_PATHS).toHaveLength(2);
    const ids = EXPERIENCE_PATHS.map((p) => p.id);
    expect(new Set(ids).size).toBe(2);

    const compass = EXPERIENCE_PATHS.find((p) => p.id === "compass");
    const chat = EXPERIENCE_PATHS.find((p) => p.id === "chat");
    expect(compass?.href).toBe("/compass");
    expect(chat?.href).toBe("/chat");
    expect(compass?.ctaLabel).toMatch(/compass/i);
    expect(chat?.ctaLabel).toMatch(/conversation/i);
  });
});
