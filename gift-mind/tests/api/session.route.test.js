import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockConfigured, mockCreate, mockSeed } = vi.hoisted(() => ({
  mockConfigured: vi.fn(() => false),
  mockCreate: vi.fn(),
  mockSeed: vi.fn(),
}));

vi.mock("@/lib/supabase-admin.js", () => ({
  isSupabaseConfigured: () => mockConfigured(),
}));

vi.mock("@/lib/gift-sessions.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createGiftSession: (...args) => mockCreate(...args),
    seedSessionMessages: (...args) => mockSeed(...args),
  };
});

import { POST } from "@/app/api/session/route.js";

function makeReq(json) {
  return { json: async () => json };
}

describe("POST /api/session", () => {
  beforeEach(() => {
    mockConfigured.mockReturnValue(false);
    mockCreate.mockReset();
    mockSeed.mockReset();
  });

  it("returns persistence off when Supabase is not configured", async () => {
    const res = await POST(
      makeReq({
        recipient: "partner",
        occasion: "birthday",
        messages: [{ role: "assistant", content: "Hi" }],
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: null, persistence: "off" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates session and seeds messages when configured", async () => {
    mockConfigured.mockReturnValue(true);
    mockCreate.mockResolvedValue("550e8400-e29b-41d4-a716-446655440000");
    mockSeed.mockResolvedValue(undefined);

    const res = await POST(
      makeReq({
        recipient: "partner",
        occasion: "birthday",
        messages: [
          { role: "user", content: "Context", hidden: true },
          { role: "assistant", content: "Hello" },
        ],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(data.persistence).toBe("supabase");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "partner",
        occasion: "birthday",
      })
    );
    expect(mockSeed).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      expect.arrayContaining([
        expect.objectContaining({ role: "user", content: "Context", hidden: true }),
        expect.objectContaining({ role: "assistant", content: "Hello", hidden: false }),
      ])
    );
  });
});
