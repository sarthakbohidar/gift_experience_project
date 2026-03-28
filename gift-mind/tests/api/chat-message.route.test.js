import { describe, it, expect, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/groq.js", () => ({
  groq: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}));

import { POST } from "@/app/api/chat/message/route.js";

function makeReq(json) {
  return { json: async () => json };
}

async function readAllTextFromStream(readable) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

describe("POST /api/chat/message", () => {
  it("streams SSE chunks and ends with [DONE]", async () => {
    async function* fakeGroqStream() {
      yield { choices: [{ delta: { content: "Hello" } }] };
      yield { choices: [{ delta: { content: " there" } }] };
      yield { choices: [{ delta: {} }] };
    }

    mockCreate.mockResolvedValue(fakeGroqStream());

    const res = await POST(
      makeReq({
        messages: [{ role: "user", content: "Hi" }],
        recipient: "Mom",
        occasion: "Birthday",
      })
    );

    expect(mockCreate).toHaveBeenCalled();
    const groqArg = mockCreate.mock.calls[0][0];
    expect(groqArg.messages[0].role).toBe("system");
    expect(groqArg.messages[0].content).toContain("Mom");
    expect(groqArg.messages[0].content).toContain("Birthday");
    expect(groqArg.messages[0].content).toContain("ACTIVE_MODE: CONVERSATION");

    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const bodyText = await readAllTextFromStream(res.body);
    expect(bodyText).toContain('data: {"text":"Hello"}');
    expect(bodyText).toContain('data: {"text":" there"}');
    expect(bodyText).toContain("data: [DONE]");
  });

  it("returns JSON 429 when Groq rate-limits before streaming", async () => {
    mockCreate.mockRejectedValue({
      status: 429,
      message: "429 rate limit exceeded",
    });

    const res = await POST(
      makeReq({
        messages: [{ role: "user", content: "Hi" }],
        recipient: "Mom",
        occasion: "Birthday",
      })
    );

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/usage limit/i);
  });
});

