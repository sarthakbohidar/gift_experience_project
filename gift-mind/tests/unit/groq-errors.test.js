import { describe, it, expect } from "vitest";

import { groqErrorToHttpResponse } from "@/lib/groq-errors.js";

describe("groqErrorToHttpResponse", () => {
  it("maps 429 / rate limit to 429 and a clear message", () => {
    const r = groqErrorToHttpResponse({
      status: 429,
      message: "Rate limit reached for model",
    });
    expect(r.status).toBe(429);
    expect(r.error).toMatch(/usage limit|rate/i);
    expect(r.error).toMatch(/groq\.com/i);
  });

  it("detects rate limit from message text when status missing", () => {
    const r = groqErrorToHttpResponse(new Error("tokens per day (TPD): Limit exceeded"));
    expect(r.status).toBe(429);
  });

  it("maps 401/403 to auth hint", () => {
    expect(groqErrorToHttpResponse({ status: 401, message: "x" }).error).toMatch(
      /GROQ_API_KEY|authorize/i
    );
  });

  it("maps unknown errors to 500 with safe fallback", () => {
    const r = groqErrorToHttpResponse(new Error("x".repeat(400)));
    expect(r.status).toBe(500);
    expect(r.error.length).toBeLessThan(200);
  });
});
