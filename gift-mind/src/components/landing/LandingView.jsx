"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  CTA_FOOTNOTE,
  EXPERIENCE_PATHS,
  HOW_IT_WORKS_STEPS,
  LANDING_BRAND,
  LANDING_FOOTER_TAGLINE,
  LANDING_HERO,
  TRUST_LINE,
} from "@/components/landing/landing-content.js";

const easeEmphasized = [0.05, 0.7, 0.1, 1];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeEmphasized },
  },
};

export default function LandingView() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-md-surface px-4 pb-20 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(168,218,181,0.06),transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl">
        <span className="md-title-medium inline-block font-semibold text-md-primary">
          {LANDING_BRAND}
        </span>

        <motion.div
          className="mt-16 flex flex-col items-center text-center sm:mt-20"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeEmphasized }}
        >
          <div className="relative mx-auto max-w-[680px] px-2">
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(168, 218, 181, 0.06) 0%, transparent 70%)",
              }}
            />
            <h1 className="text-balance text-center text-[36px] font-bold leading-[44px] tracking-tight text-md-on-surface sm:text-[45px] sm:leading-[52px]">
              {LANDING_HERO.title}
            </h1>
          </div>
          <p className="md-body-large mx-auto mt-4 max-w-[540px] text-md-on-surface-variant">
            {LANDING_HERO.description}
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-14 flex max-w-[760px] flex-col items-stretch justify-center gap-3 sm:mt-16 sm:flex-row sm:gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {EXPERIENCE_PATHS.map((path) => (
            <motion.div
              key={path.id}
              variants={item}
              className="mx-auto w-full max-w-[360px] flex-1"
            >
              <Link
                href={path.href}
                className={[
                  "group flex min-h-[200px] flex-col rounded-[28px] border border-md-outline-variant bg-md-surface-container-high p-7 shadow-md-card transition-all duration-[400ms]",
                  path.accent === "primary"
                    ? "border-l-[3px] border-l-md-primary hover:border-md-primary/40 hover:shadow-md-glow-primary"
                    : "border-l-[3px] border-l-md-tertiary hover:border-md-tertiary/50 hover:shadow-[0_0_30px_var(--md-glow-tertiary)]",
                ].join(" ")}
                style={{ transitionTimingFunction: "cubic-bezier(0.05, 0.7, 0.1, 1)" }}
              >
                <span className="md-label-small inline-flex w-fit rounded-md bg-md-primary-container px-3 py-1 text-md-on-primary-container">
                  {path.badge}
                </span>
                <h2 className="md-headline-small mt-5 text-left text-md-on-surface">
                  {path.title}
                </h2>
                <p className="md-body-medium mt-2 flex-1 text-left text-md-on-surface-variant">
                  {path.description}
                </p>
                <span
                  className={[
                    "mt-6 flex min-h-10 w-full items-center justify-center rounded-full px-7 py-3 md-label-large transition",
                    path.variant === "filled"
                      ? "bg-md-primary text-md-on-primary group-hover:brightness-110"
                      : "border border-md-outline bg-transparent text-md-primary group-hover:bg-[rgba(168,218,181,0.08)]",
                  ].join(" ")}
                >
                  {path.ctaLabel}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <p className="md-body-medium mx-auto mt-8 max-w-lg text-center text-md-on-surface-variant">
          {CTA_FOOTNOTE}
        </p>

        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeEmphasized }}
        >
          <h2 className="md-headline-medium text-md-on-surface">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.25 + i * 0.15,
                  duration: 0.4,
                  ease: easeEmphasized,
                }}
                className="rounded-2xl border border-md-outline-variant bg-md-surface-container p-6 text-center"
              >
                <div className="text-[32px]" aria-hidden>
                  {step.emoji}
                </div>
                <h3 className="md-title-medium mt-3 text-md-on-surface">{step.title}</h3>
                <p className="md-body-medium mt-2 text-md-on-surface-variant">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto mt-12 max-w-[520px] border-t border-md-outline-variant pt-12 text-center">
          <p className="md-body-medium text-md-on-surface-variant">{TRUST_LINE}</p>
        </div>

        <footer className="md-body-small mt-8 pb-4 pt-8 text-center text-md-outline">
          {LANDING_FOOTER_TAGLINE}
        </footer>
      </div>
    </main>
  );
}
