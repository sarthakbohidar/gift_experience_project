// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DirectionCard from "@/components/ui/DirectionCard.jsx";

const baseDirection = {
  headline: "A vivid headline",
  detail: "Some detail",
  why_it_resonates: "Because reasons",
  gift_story: "A message",
  category: "default",
};

describe("DirectionCard", () => {
  it("renders headline and sections", () => {
    render(<DirectionCard direction={baseDirection} whereToLook={[]} />);
    expect(screen.getByLabelText("Direction Card")).toBeInTheDocument();
    expect(screen.getByText(/YOUR GIFT DIRECTION/)).toBeInTheDocument();
    expect(screen.getByText("A vivid headline")).toBeInTheDocument();
    expect(screen.getByText("💡 Why this resonates")).toBeInTheDocument();
    expect(screen.getByText("💌 What to write on the card")).toBeInTheDocument();
    expect(screen.getByText("📍 Where to look")).toBeInTheDocument();
  });

  it("renders where-to-look pills; url=null becomes a span", () => {
    render(
      <DirectionCard
        direction={baseDirection}
        whereToLook={[
          { name: "Local", type: "offline", url: null },
          { name: "Site", type: "marketplace", url: "https://example.com" },
        ]}
      />
    );

    expect(screen.getByText("Local").tagName.toLowerCase()).toBe("span");
    const link = screen.getByText("Site").closest("a");
    expect(link).toBeTruthy();
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("copy button is disabled when gift_story missing", () => {
    render(<DirectionCard direction={{ ...baseDirection, gift_story: "" }} />);
    expect(screen.getByRole("button", { name: "Copy gift story" })).toBeDisabled();
  });

  it("clicking copy shows Copied! when clipboard succeeds and auto-resets", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<DirectionCard direction={baseDirection} />);

    const copyBtn = screen.getByRole("button", { name: "Copy gift story" });
    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("A message");

    // Resolve the async copy handler
    await Promise.resolve();
    await Promise.resolve();
    await vi.runAllTicks();
    expect(copyBtn.textContent).toMatch(/Copied/i);

    vi.advanceTimersByTime(2100);
    await Promise.resolve();
    await vi.runAllTicks();
    expect(copyBtn).toHaveTextContent("📋 Copy");
    vi.useRealTimers();
  }, 10000);
});

