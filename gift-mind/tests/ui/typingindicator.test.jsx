// @vitest-environment jsdom

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TypingIndicator from "@/components/ui/TypingIndicator.jsx";

describe("TypingIndicator", () => {
  it("renders with accessibility label", () => {
    render(<TypingIndicator />);
    expect(screen.getByLabelText("Typing…")).toBeInTheDocument();
  });
});

