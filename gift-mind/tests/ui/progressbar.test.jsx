// @vitest-environment jsdom

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/ui/ProgressBar.jsx";

describe("ProgressBar", () => {
  it("renders total dots and marks current", () => {
    render(<ProgressBar total={6} current={2} />);
    // 6 labeled steps
    expect(screen.getByLabelText("Step 3 (current)")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 (completed)")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 2 (completed)")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 6")).toBeInTheDocument();
  });

  it("handles invalid total gracefully", () => {
    render(<ProgressBar total={0} current={0} />);
    expect(screen.getByLabelText("Step 1 (current)")).toBeInTheDocument();
  });
});

