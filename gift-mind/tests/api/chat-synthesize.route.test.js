import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/groq.js", () => ({
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from "@/lib/groq.js";
import { POST } from "@/app/api/chat/synthesize/route.js";

function makeReq(json) {
  return { json: async () => json };
}

describe("POST /api/chat/synthesize", () => {
  beforeEach(() => {
    generateCompletion.mockReset();
  });

  it("uses conversation messages and returns direction + where_to_look", async () => {
    generateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              "```json\n{\"direction\":{\"headline\":\"H\",\"detail\":\"D\",\"why_it_resonates\":\"W\",\"gift_story\":\"S\",\"category\":\"wellness_selfcare\"}}\n```",
          },
        },
      ],
    });

    const res = await POST(
      makeReq({
        recipient: "Mom",
        occasion: "Birthday",
        messages: [{ role: "user", content: "She loves quiet evenings." }],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.direction.category).toBe("wellness_selfcare");
    expect(data.where_to_look).toHaveLength(3);
  });

  it("handles missing messages array gracefully", async () => {
    generateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              "{\"direction\":{\"headline\":\"H\",\"detail\":\"D\",\"why_it_resonates\":\"W\",\"gift_story\":\"S\",\"category\":\"default\"}}",
          },
        },
      ],
    });

    const res = await POST(makeReq({ recipient: "x", occasion: "y" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.where_to_look[0].name).toBe("Amazon India");
  });

  it("returns 429 when Groq rate-limits", async () => {
    generateCompletion.mockRejectedValue({
      status: 429,
      message: "Rate limit reached",
    });

    const res = await POST(makeReq({ messages: [{ role: "user", content: "Hi" }] }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/usage limit/i);
  });

  it("returns 500 on parse failure", async () => {
    generateCompletion.mockResolvedValue({
      choices: [{ message: { content: "```json\n{bad\n```" } }],
    });

    const res = await POST(makeReq({ messages: [] }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("parses JSON after short preamble from the model", async () => {
    const inner = {
      direction: {
        headline: "H",
        detail: "D",
        why_it_resonates: "W",
        gift_story: "S",
        category: "default",
      },
    };
    generateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: `Sure — here is the direction JSON:\n${JSON.stringify(inner)}`,
          },
        },
      ],
    });

    const res = await POST(
      makeReq({ messages: [{ role: "user", content: "Mom likes plants." }] })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.direction.headline).toBe("H");
  });
});

