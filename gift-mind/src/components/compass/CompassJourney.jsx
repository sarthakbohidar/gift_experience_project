"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { compassForks } from "@/lib/compass-data.js";
import {
  buildCompassGenerateBody,
  isCompassSelectionComplete,
  writeDirectionToSession,
} from "@/lib/compass-session.js";
import Button from "@/components/ui/Button.jsx";
import ForkCard from "@/components/ui/ForkCard.jsx";
import ProgressBar from "@/components/ui/ProgressBar.jsx";

const easeStandard = [0.2, 0, 0, 1];

/** Equal-size cells: 3-up on sm+; 5-up uses centered second row on 6-col grid; mobile 2-col with aligned orphan row. */
function ForkOptionGrid({ fork, selectedValue, onPickOption }) {
  const n = fork.options.length;

  const Card = ({ opt }) => (
    <ForkCard
      emoji={opt.emoji}
      label={opt.label}
      selected={selectedValue === opt.value}
      onClick={() => onPickOption(opt.value)}
    />
  );

  if (n === 5) {
    return (
      <>
        <div className="grid grid-cols-2 grid-rows-[auto_auto_auto] gap-3 sm:hidden">
          {fork.options.slice(0, 4).map((opt) => (
            <div key={opt.value} className="min-h-0 min-w-0">
              <Card opt={opt} />
            </div>
          ))}
          <div className="col-span-2 flex justify-center">
            <div className="w-[calc((100%-0.75rem)/2)] min-w-0 max-w-[calc((100%-0.75rem)/2)]">
              <Card opt={fork.options[4]} />
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-6 gap-3 sm:grid sm:items-stretch">
          {fork.options.slice(0, 3).map((opt) => (
            <div key={opt.value} className="col-span-2 min-h-0 min-w-0">
              <Card opt={opt} />
            </div>
          ))}
          <div className="col-span-2 col-start-2 min-h-0 min-w-0">
            <Card opt={fork.options[3]} />
          </div>
          <div className="col-span-2 col-start-4 min-h-0 min-w-0">
            <Card opt={fork.options[4]} />
          </div>
        </div>
      </>
    );
  }

  if (n === 3) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-stretch">
        {fork.options.map((opt, i) => {
          if (i < 2) {
            return (
              <div key={opt.value} className="min-h-0 min-w-0">
                <Card opt={opt} />
              </div>
            );
          }
          return (
            <div
              key={opt.value}
              className="col-span-2 flex justify-center sm:col-span-1 sm:block sm:justify-stretch"
            >
              <div className="w-[calc((100%-0.75rem)/2)] min-w-0 sm:w-full">
                <Card opt={opt} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-stretch">
      {fork.options.map((opt) => (
        <div key={opt.value} className="min-h-0 min-w-0">
          <Card opt={opt} />
        </div>
      ))}
    </div>
  );
}

export default function CompassJourney() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [selections, setSelections] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fork = compassForks[currentStep];
  const total = compassForks.length;

  const submitGenerate = useCallback(
    (nextSelections) => {
      const body = buildCompassGenerateBody(nextSelections);
      setIsGenerating(true);
      setError(null);
      (async () => {
        const started = Date.now();
        const minWaitMs = 2000;
        try {
          const res = await fetch("/api/compass/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.error || `Request failed (${res.status})`);
          }
          if (!data.direction) {
            throw new Error("Something went wrong — no direction returned.");
          }
          const elapsed = Date.now() - started;
          if (elapsed < minWaitMs) {
            await new Promise((r) => setTimeout(r, minWaitMs - elapsed));
          }
          writeDirectionToSession({
            direction: data.direction,
            where_to_look: data.where_to_look || [],
            recipient: body.recipient,
            occasion: body.occasion,
            compass_selections: { ...nextSelections },
          });
          router.push("/compass/result");
        } catch (e) {
          setError(e?.message || "GiftMind hit a snag. Please try again.");
        } finally {
          setIsGenerating(false);
        }
      })();
    },
    [router]
  );

  const goBack = useCallback(() => {
    if (currentStep <= 0) return;
    const leavingId = compassForks[currentStep].id;
    setSlideDir(-1);
    setCurrentStep((s) => s - 1);
    setSelections((prev) => {
      const next = { ...prev };
      delete next[leavingId];
      return next;
    });
    setError(null);
  }, [currentStep]);

  const onPickOption = useCallback(
    (value) => {
      if (!fork) return;
      const nextSelections = { ...selections, [fork.id]: value };
      setSelections(nextSelections);
      setError(null);

      if (currentStep < total - 1) {
        setSlideDir(1);
        setCurrentStep((s) => s + 1);
        return;
      }

      submitGenerate(nextSelections);
    },
    [currentStep, fork, selections, submitGenerate, total]
  );

  const onRetryAfterError = useCallback(() => {
    if (isCompassSelectionComplete(selections)) {
      submitGenerate(selections);
      return;
    }
    setError(null);
  }, [selections, submitGenerate]);

  if (isGenerating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-md-surface px-4 text-center">
        <p className="md-title-large max-w-sm text-md-on-surface-variant">
          ✨ Crafting your perfect gift direction…
        </p>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-md-primary"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-2xl border border-md-outline-variant bg-md-surface-container p-6 text-center shadow-md-card">
          <p className="md-title-small font-semibold text-md-on-surface">
            We couldn’t get your direction
          </p>
          <p className="md-body-medium mt-2 text-md-on-surface-variant">{error}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={onRetryAfterError}>
              Try again
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setError(null);
                setCurrentStep(0);
                setSelections({});
                setSlideDir(1);
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedValue = fork ? selections[fork.id] : undefined;
  const exitX = slideDir * -40;
  const enterX = slideDir * 40;

  return (
    <div className="relative min-h-screen bg-md-surface px-6 pb-12 pt-14 sm:px-8">
      <Link
        href="/"
        aria-label="Back to home"
        className="md-label-large absolute left-4 top-4 z-10 text-md-on-surface-variant transition-colors hover:text-md-primary sm:left-6 sm:top-5"
      >
        <span aria-hidden>←</span>
        <span className="hidden sm:inline"> Back</span>
      </Link>

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[560px] flex-col justify-center">
        <div className="mb-6 flex justify-center">
          <ProgressBar total={total} current={currentStep} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={fork.id}
            initial={{ opacity: 0, x: enterX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitX }}
            transition={{
              duration: slideDir === 1 ? 0.3 : 0.25,
              ease: easeStandard,
            }}
          >
            <h1 className="md-headline-medium text-center text-md-on-surface max-sm:text-2xl max-sm:leading-8">
              {fork.question}
            </h1>
            {fork.subtitle ? (
              <p className="md-body-medium mt-1.5 text-center text-md-on-surface-variant">
                {fork.subtitle}
              </p>
            ) : null}

            <div className="mt-8">
              <ForkOptionGrid
                fork={fork}
                selectedValue={selectedValue}
                onPickOption={onPickOption}
              />
            </div>

            {currentStep > 0 ? (
              <div className="mt-6 flex justify-center">
                <Button variant="text" type="button" onClick={goBack} className="!text-md-on-surface-variant hover:!text-md-primary">
                  ← Back
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
