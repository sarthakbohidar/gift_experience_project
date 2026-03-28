// @vitest-environment jsdom

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatBubble from "@/components/ui/ChatBubble.jsx";

describe("ChatBubble", () => {
  it("renders assistant bubble with 🎁 prefix", () => {
    render(<ChatBubble role="assistant" content="Hello" />);
    expect(screen.getByText(/🎁 Hello/)).toBeInTheDocument();
  });

  it("renders user bubble without prefix", () => {
    render(<ChatBubble role="user" content="Hi" />);
    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.queryByText(/🎁 Hi/)).toBeNull();
  });

  it("shows streaming cursor when isStreaming=true", () => {
    render(<ChatBubble role="assistant" content="Typing" isStreaming />);
    expect(screen.getByLabelText("cursor")).toBeInTheDocument();
  });
});

