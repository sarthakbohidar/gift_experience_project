// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ForkCard from "@/components/ui/ForkCard.jsx";

describe("ForkCard", () => {
  it("renders emoji and label", () => {
    render(<ForkCard emoji="✨" label="Surprise me" />);
    expect(screen.getByText("✨")).toBeInTheDocument();
    expect(screen.getByText("Surprise me")).toBeInTheDocument();
  });

  it("shows selected state and aria-pressed", () => {
    render(<ForkCard emoji="🎁" label="Pick me" selected />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn.className).toContain("border-md-primary");
    expect(screen.getByText("Pick me")).toBeInTheDocument();
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<ForkCard emoji="🎁" label="Tap" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

