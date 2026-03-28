import { describe, it, expect } from "vitest";

import { sanitizeGiftStory } from "@/lib/gift-story.js";

describe("sanitizeGiftStory", () => {
  it("removes square-bracket placeholders", () => {
    expect(sanitizeGiftStory("Hi [Your Name], love you")).toBe("Hi, love you");
    expect(sanitizeGiftStory("[Recipient] is the best")).toBe("is the best");
  });

  it("trims and collapses spaces without mangling normal copy", () => {
    expect(sanitizeGiftStory("  A full card message.  ")).toBe("A full card message.");
  });

  it("handles empty after strip", () => {
    expect(sanitizeGiftStory("[x]")).toBe("With love.");
  });
});
