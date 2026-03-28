// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: function MockLink({ href, children, ...rest }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

import LandingView from "@/components/landing/LandingView.jsx";

describe("LandingView", () => {
  it("renders primary CTAs to compass and chat", () => {
    render(<LandingView />);

    const compass = screen.getByRole("link", { name: /Start compass/i });
    const chat = screen.getByRole("link", { name: /Start conversation/i });

    expect(compass).toHaveAttribute("href", "/compass");
    expect(chat).toHaveAttribute("href", "/chat");
  });

  it("does not show component playground link", () => {
    render(<LandingView />);
    expect(screen.queryByRole("link", { name: /playground/i })).toBeNull();
  });
});
