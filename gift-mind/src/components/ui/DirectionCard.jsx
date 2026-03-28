"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import Button from "@/components/ui/Button.jsx";
import { sanitizeGiftStory } from "@/lib/gift-story.js";

function safeText(v) {
  return typeof v === "string" ? v : "";
}

async function copyToClipboard(text) {
  if (typeof navigator === "undefined") return false;
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function DirectionCard({
  direction,
  whereToLook = [],
  onLoveIt,
  onGoDeeper,
  onStartOver,
  className = "",
}) {
  const headline = safeText(direction?.headline);
  const detail = safeText(direction?.detail);
  const why = safeText(direction?.why_it_resonates);
  const rawStory = safeText(direction?.gift_story);
  const story = useMemo(() => sanitizeGiftStory(rawStory), [rawStory]);
  const storyForCopy = story || sanitizeGiftStory(rawStory);

  const pills = useMemo(() => {
    if (!Array.isArray(whereToLook)) return [];
    return whereToLook
      .filter((x) => x && typeof x.name === "string")
      .slice(0, 6);
  }, [whereToLook]);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function onCopy() {
    setCopyError(false);
    const toCopy = storyForCopy || rawStory;
    const ok = await copyToClipboard(toCopy);
    if (ok) setCopied(true);
    else setCopyError(true);
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.05, 0.7, 0.1, 1] }}
        className={[
          "mx-auto max-w-[640px] rounded-[28px] border border-md-outline-variant bg-md-surface-container-high px-7 py-9 shadow-md-direction sm:px-9",
          className,
        ].join(" ")}
        aria-label="Direction Card"
      >
        <div className="md-label-medium mb-4 uppercase tracking-[1.5px] text-md-outline">
          🎁 YOUR GIFT DIRECTION
        </div>

        <h2 className="text-pretty text-[28px] font-semibold leading-9 text-md-primary sm:text-[32px] sm:leading-10">
          {headline || "A thoughtful gift direction"}
        </h2>

        {detail ? (
          <p className="md-body-large mt-3 leading-[1.7] text-md-on-surface-variant">{detail}</p>
        ) : null}

        <div className="my-6 h-px w-full bg-md-outline-variant" />

        <div>
          <div className="md-label-large text-md-tertiary">💡 Why this resonates</div>
          <div
            className="md-body-large mt-2.5 rounded-r-xl border-l-[3px] border-md-tertiary py-4 pl-5 pr-5 leading-[1.65] text-md-on-surface"
            style={{ background: "rgba(78, 72, 0, 0.15)" }}
          >
            {why || "GiftMind will explain why this feels right for them."}
          </div>
        </div>

        <div className="my-6 h-px w-full bg-md-outline-variant" />

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="md-label-large text-md-secondary">💌 What to write on the card</div>
            <button
              type="button"
              onClick={onCopy}
              className="md-label-large rounded-lg px-3 py-1.5 text-md-on-surface-variant transition hover:bg-md-surface-container-highest hover:text-md-primary"
              aria-label="Copy gift story"
              disabled={!String(rawStory || "").trim()}
            >
              {copied ? (
                <span className="text-md-primary">✓ Copied!</span>
              ) : (
                <>📋 Copy</>
              )}
            </button>
          </div>

          <div
            className="md-body-large mt-2.5 rounded-r-xl border-l-[3px] border-md-secondary bg-md-surface-container py-5 pl-6 pr-6 italic leading-[1.7] text-md-on-surface"
          >
            {story ? `“${story}”` : "GiftMind will generate a heartfelt message you can paste into a card."}
          </div>
          {copyError ? (
            <div className="md-body-small mt-2 text-md-error">
              Copy didn’t work in this browser — try selecting the text manually.
            </div>
          ) : null}
        </div>

        <div className="my-6 h-px w-full bg-md-outline-variant" />

        <div>
          <div className="md-label-large text-md-on-surface-variant">📍 Where to look</div>
          <div className="mt-3 flex max-w-full flex-wrap gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {pills.length ? (
              pills.map((p) => {
                const name = p.name;
                const url = p.url;
                const isLink = typeof url === "string" && url.length > 0;
                const chip =
                  "inline-flex items-center gap-1 rounded-md border border-md-outline-variant bg-md-surface-container px-4 py-2 md-label-large text-md-on-surface transition hover:border-md-outline hover:bg-md-surface-container-highest";

                return isLink ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={chip}
                  >
                    {name} <span aria-hidden>↗</span>
                  </a>
                ) : (
                  <span key={name} className={chip}>
                    {name}
                  </span>
                );
              })
            ) : (
              <span className="md-body-medium text-md-on-surface-variant">
                Suggestions will appear here.
              </span>
            )}
          </div>
        </div>
      </motion.section>

      {onLoveIt || onGoDeeper || onStartOver ? (
        <div className="mx-auto mt-6 flex max-w-[640px] flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
          {onLoveIt ? (
            <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={onLoveIt}>
              Love it! ✨
            </Button>
          ) : null}
          {onGoDeeper ? (
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onGoDeeper}>
              Go deeper 💬
            </Button>
          ) : null}
          {onStartOver ? (
            <Button type="button" variant="text" className="w-full sm:w-auto" onClick={onStartOver}>
              Start over 🔄
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
