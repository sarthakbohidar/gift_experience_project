"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ForkCard({
  emoji,
  label,
  selected = false,
  onClick,
  className = "",
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      animate={selected ? { scale: [0.96, 1] } : { scale: 1 }}
      transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
      whileHover={{
        y: -3,
        transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
      }}
      whileTap={{ scale: 0.97 }}
      className={[
        "flex h-full min-h-[132px] w-full flex-col items-center justify-center rounded-2xl border-[1.5px] px-3 py-4 transition-all duration-[250ms]",
        selected
          ? "border-md-primary bg-md-primary-container shadow-[0_0_20px_var(--md-glow-primary)]"
          : "border-md-outline-variant bg-md-surface-container hover:border-md-primary/60 hover:bg-md-surface-container-high hover:shadow-[0_0_20px_var(--md-glow-primary)]",
        className,
      ].join(" ")}
      style={{ transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)" }}
      aria-pressed={selected}
    >
      <span className="mb-2 shrink-0 text-[28px] leading-none" aria-hidden>
        {emoji}
      </span>
      <span
        className={[
          "md-title-small line-clamp-4 w-full text-center leading-snug",
          selected ? "text-md-on-primary-container" : "text-md-on-surface",
        ].join(" ")}
      >
        {label}
      </span>
    </motion.button>
  );
}
