// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/ui/Button.jsx";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("supports variants", () => {
    const { rerender } = render(<Button variant="primary">P</Button>);
    expect(screen.getByRole("button", { name: "P" }).className).toContain("bg-md-primary");

    rerender(<Button variant="secondary">S</Button>);
    expect(screen.getByRole("button", { name: "S" }).className).toContain("border-md-outline");

    rerender(<Button variant="ghost">G</Button>);
    expect(screen.getByRole("button", { name: "G" }).className).toContain("bg-transparent");
  });

  it("falls back to primary for unknown variant", () => {
    render(<Button variant="weird">X</Button>);
    expect(screen.getByRole("button", { name: "X" }).className).toContain("bg-md-primary");
  });

  it("respects disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

