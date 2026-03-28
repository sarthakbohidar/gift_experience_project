import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("groq-sdk", () => ({
  default: class MockGroq {
    constructor() {
      this.chat = {
        completions: {
          create: mockCreate,
        },
      };
    }
  },
}));

import { generateCompletion } from "../../src/lib/groq.js";

describe("generateCompletion", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ choices: [] });
  });

  it("calls Groq with llama-3.3-70b-versatile and non-streaming by default", async () => {
    const messages = [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
    ];
    await generateCompletion(messages);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.8,
      max_tokens: 1024,
      stream: false,
    });
  });

  it("passes stream: true when second argument is true", async () => {
    await generateCompletion([], true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true })
    );
  });

  it("returns the SDK response object", async () => {
    const fake = { choices: [{ message: { content: "{}" } }] };
    mockCreate.mockResolvedValue(fake);
    const result = await generateCompletion([{ role: "user", content: "x" }]);
    expect(result).toBe(fake);
  });

  it("propagates SDK errors (caller handles try/catch in routes)", async () => {
    mockCreate.mockRejectedValue(new Error("rate limit"));
    await expect(
      generateCompletion([{ role: "user", content: "x" }])
    ).rejects.toThrow("rate limit");
  });
});
