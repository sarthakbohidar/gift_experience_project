"use client";

import React from "react";
import { motion } from "framer-motion";

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-7 py-3 md-label-large font-medium tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary/40 disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary:
    "bg-md-primary text-md-on-primary hover:brightness-110 active:brightness-95",
  secondary:
    "border border-md-outline bg-transparent text-md-primary hover:bg-[rgba(168,218,181,0.08)] active:bg-[rgba(168,218,181,0.12)]",
  ghost:
    "border-0 bg-transparent text-md-primary hover:bg-[rgba(168,218,181,0.08)] active:bg-[rgba(168,218,181,0.12)]",
  text:
    "border-0 bg-transparent px-4 text-md-on-surface-variant hover:bg-[rgba(168,218,181,0.08)] hover:text-md-primary active:scale-[0.97]",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const v = variants[variant] ?? variants.primary;
  const cls = `${base} ${v} ${className}`;

  return (
    <motion.button
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      whileHover={props.disabled ? undefined : { scale: variant === "text" ? 1 : 1.01 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cls}
      {...props}
    >
      {children}
    </motion.button>
  );
}
