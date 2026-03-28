"use client";

import { useState } from "react";
import Button from "@/components/ui/Button.jsx";
import ForkCard from "@/components/ui/ForkCard.jsx";
import ProgressBar from "@/components/ui/ProgressBar.jsx";
import DirectionCard from "@/components/ui/DirectionCard.jsx";
import ChatBubble from "@/components/ui/ChatBubble.jsx";
import TypingIndicator from "@/components/ui/TypingIndicator.jsx";
import { whereToLookMap } from "@/lib/where-to-look.js";

export default function TestUIPage() {
  const [selected, setSelected] = useState("partner");
  const [step, setStep] = useState(2);

  const direction = {
    headline: "A tiny ‘memory ritual’ kit for their everyday calm",
    detail:
      "Put together a small, beautiful box: a note, a photo print, and one calming daily ritual item.",
    why_it_resonates:
      "It turns your shared bond into something they can feel on ordinary days — not just on the occasion.",
    gift_story:
      "For all the little ways you show up, every day.\nHere’s a small ritual to remind you you’re deeply loved.\nHappy birthday — always in my corner.",
    category: "stationery_artisan",
  };

  const whereToLook = whereToLookMap.stationery_artisan;

  return (
    <main className="min-h-screen bg-md-surface px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-md-on-surface">UI Playground</h1>
        <p className="md-body-medium mt-2 text-md-on-surface-variant">
          Visual check for M3 dark components.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="md-label-large text-md-outline">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => alert("primary")}>Primary</Button>
            <Button variant="secondary" onClick={() => alert("secondary")}>
              Secondary
            </Button>
            <Button variant="ghost" onClick={() => alert("ghost")}>
              Ghost
            </Button>
            <Button variant="text" onClick={() => alert("text")}>
              Text
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="md-label-large text-md-outline">ProgressBar</h2>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </Button>
            <ProgressBar total={6} current={step} />
            <Button variant="secondary" onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Next
            </Button>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="md-label-large text-md-outline">ForkCard</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <ForkCard
              emoji="💑"
              label="Partner / Spouse"
              selected={selected === "partner"}
              onClick={() => setSelected("partner")}
            />
            <ForkCard
              emoji="👨‍👩‍👧"
              label="Mom or Dad"
              selected={selected === "parent"}
              onClick={() => setSelected("parent")}
            />
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="md-label-large text-md-outline">ChatBubble</h2>
          <div className="space-y-3">
            <ChatBubble role="assistant" content="Tell me a tiny habit of theirs you love." />
            <ChatBubble role="user" content="She always waters her plants before chai." />
            <ChatBubble role="assistant" content="That’s such a sweet detail." isStreaming />
            <TypingIndicator />
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="md-label-large text-md-outline">DirectionCard</h2>
          <DirectionCard
            direction={direction}
            whereToLook={whereToLook}
            onLoveIt={() => alert("Love it!")}
            onGoDeeper={() => alert("Go deeper")}
            onStartOver={() => alert("Start over")}
          />
        </section>
      </div>
    </main>
  );
}
