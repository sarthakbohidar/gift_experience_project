import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/groq.js", () => ({
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from "@/lib/groq.js";
import { POST } from "@/app/api/compass/generate/route.js";

function makeReq(json) {
  return { json: async () => json };
}

describe("POST /api/compass/generate", () => {
  beforeEach(() => {
    generateCompletion.mockReset();
  });

  it("parses fenced JSON and returns direction + where_to_look", async () => {
    generateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              "```json\n{\"direction\":{\"headline\":\"H\",\"detail\":\"D\",\"why_it_resonates\":\"W\",\"gift_story\":\"S\",\"category\":\"books_learning\"}}\n```",
          },
        },
      ],
    });

    const res = await POST(
      makeReq({
        recipient: "parent",
        occasion: "birthday",
        forks: {
          step2_experience: "solo",
          step3_vibe: "daily_special",
          step4_nature: "elevated",
          step5_practical: "sentimental",
        },
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.direction.headline).toBe("H");
    expect(Array.isArray(data.where_to_look)).toBe(true);
    expect(data.where_to_look).toHaveLength(3);
  });

  it("falls back to default where_to_look for unknown category", async () => {
    generateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: "{\"direction\":{\"headline\":\"H\",\"detail\":\"D\",\"why_it_resonates\":\"W\",\"gift_story\":\"S\",\"category\":\"unknown\"}}",
          },
        },
      ],
    });

    const res = await POST(makeReq({ recipient: "x", occasion: "y", forks: {} }));
    const data = await res.json();
    expect(data.where_to_look[0].name).toBe("Amazon India");
  });

  it("returns 502 with error when model content is not parseable JSON", async () => {
    generateCompletion.mockResolvedValue({
      choices: [{ message: { content: "```json\nnot json\n```" } }],
    });

    const res = await POST(makeReq({ recipient: "x", occasion: "y", forks: {} }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toMatch(/parse|couldn’t/i);
  });
});

