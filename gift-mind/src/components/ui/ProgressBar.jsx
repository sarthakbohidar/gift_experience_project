"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProgressBar({ total = 6, current = 0, className = "" }) {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 1;
  const safeCurrent = Number.isFinite(current) ? Math.floor(current) : 0;

  return (
    <div
      className={["flex items-center justify-center gap-[10px]", className].join(" ")}
      role="progressbar"
      aria-valuenow={safeCurrent + 1}
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-label={`Step ${safeCurrent + 1} of ${safeTotal}`}
    >
      {Array.from({ length: safeTotal }).map((_, i) => {
        const isCompleted = i < safeCurrent;
        const isCurrent = i === safeCurrent;

        if (isCurrent) {
          return (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-md-primary"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ boxShadow: "0 0 12px var(--md-glow-primary)" }}
              aria-label={`Step ${i + 1} (current)`}
            />
          );
        }

        return (
          <motion.div
            key={i}
            className={[
              "h-2 w-2 shrink-0 rounded-full transition-all duration-300 ease-out",
              isCompleted ? "bg-md-primary" : "bg-md-outline-variant",
            ].join(" ")}
            aria-label={
              isCompleted
                ? `Step ${i + 1} (completed)`
                : `Step ${i + 1}`
            }
          />
        );
      })}
    </div>
  );
}
