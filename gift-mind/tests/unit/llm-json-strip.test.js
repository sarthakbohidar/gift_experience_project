import { describe, it, expect } from "vitest";

/**
 * Mirrors architecture.md / API spec (used in Phase 3 routes).
 * Tests document edge cases so parsing stays predictable.
 */
function stripLlmJsonFences(text) {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

describe("stripLlmJsonFences (API contract)", () => {
  it("strips ```json ... ``` wrapper", () => {
    const raw = '```json\n{"direction":{"headline":"x"}}\n```';
    expect(stripLlmJsonFences(raw)).toBe('{"direction":{"headline":"x"}}');
  });

  it("strips ``` without json label", () => {
    const raw = '```\n{"a":1}\n```';
    expect(stripLlmJsonFences(raw)).toBe('{"a":1}');
  });

  it("handles no trailing newline after opening fence", () => {
    const raw = '```json{"a":1}```';
    expect(stripLlmJsonFences(raw)).toBe('{"a":1}');
  });

  it("trims leading and trailing whitespace outside fences", () => {
    const raw = '\n\n  ```json\n{}\n```  \n';
    expect(stripLlmJsonFences(raw)).toBe("{}");
  });

  it("leaves bare JSON untouched", () => {
    const raw = '{"direction":{}}';
    expect(stripLlmJsonFences(raw)).toBe(raw);
  });

  it("handles empty string", () => {
    expect(stripLlmJsonFences("")).toBe("");
  });

  it("does not strip case-variant ```JSON (spec is lowercase); documents behavior", () => {
    const raw = '```JSON\n{"a":1}\n```';
    const out = stripLlmJsonFences(raw);
    expect(out).not.toBe('{"a":1}');
    expect(out).toContain("JSON");
  });
});
