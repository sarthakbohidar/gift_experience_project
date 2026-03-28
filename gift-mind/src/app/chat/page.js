import { Suspense } from "react";
import Link from "next/link";

import ChatInterface from "@/components/chat/ChatInterface.jsx";

export const metadata = {
  title: "GiftMind — Chat",
  description: "Chat through what you know — get a personalized gift direction.",
};

function ChatFallback() {
  return (
    <div className="flex min-h-dvh flex-col bg-md-surface">
      <header className="flex h-14 shrink-0 items-center border-b border-md-outline-variant bg-md-surface-container-low px-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full text-md-on-surface-variant"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="flex flex-1 justify-center pr-10">
          <span className="md-title-medium text-md-primary">GiftMind</span>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 md-body-medium text-md-on-surface-variant">
        Loading chat…
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <main className="min-h-dvh bg-md-surface">
      <Suspense fallback={<ChatFallback />}>
        <ChatInterface />
      </Suspense>
    </main>
  );
}
