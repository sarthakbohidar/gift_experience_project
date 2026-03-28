"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ChatBubble({
  role = "assistant",
  content = "",
  isStreaming = false,
  className = "",
}) {
  const isUser = role === "user";
  const align = isUser ? "justify-end" : "justify-start";
  const bubble = isUser
    ? "rounded-[20px] rounded-tr-sm border border-md-primary-container/40 bg-md-primary-container text-md-on-primary-container"
    : "rounded-[20px] rounded-tl-sm border border-md-outline-variant bg-md-surface-container text-md-on-surface";

  const prefix = !isUser ? "🎁 " : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isUser ? 0.2 : 0.3,
        ease: [0.2, 0, 0, 1],
      }}
      className={["flex w-full", align, className].join(" ")}
    >
      <div
        className={[
          "max-w-[78%] px-[18px] py-3.5 md-body-large leading-[1.6]",
          isUser ? "sm:max-w-[72%]" : "sm:max-w-[78%]",
          bubble,
        ].join(" ")}
        data-role={role}
      >
        <span>{prefix}{content}</span>
        {isStreaming ? (
          <motion.span
            aria-label="cursor"
            className={
              isUser
                ? "ml-1 inline-block text-md-on-primary-container/80"
                : "ml-1 inline-block text-md-on-surface-variant"
            }
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            ▍
          </motion.span>
        ) : null}
      </div>
    </motion.div>
  );
}
