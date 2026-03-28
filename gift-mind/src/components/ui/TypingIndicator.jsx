"use client";

import React from "react";
import { motion } from "framer-motion";

export default function TypingIndicator({ className = "" }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-[20px] rounded-tl-sm border border-md-outline-variant bg-md-surface-container px-4 py-3 opacity-70",
        className,
      ].join(" ")}
      aria-label="Typing…"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
          className="h-[7px] w-[7px] shrink-0 rounded-full bg-md-on-surface-variant"
        />
      ))}
    </div>
  );
}
