"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import DirectionCard from "@/components/ui/DirectionCard.jsx";
import {
  readDirectionFromSession,
  clearDirectionFromSession,
  writeChatBootstrapToSession,
} from "@/lib/compass-session.js";
import { buildCompassGoDeeperBootstrap } from "@/lib/deeper-chat.js";
import { stashGoDeeperBootstrap } from "@/lib/deep-bootstrap-bridge.js";

export default function CompassResultPage() {
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const data = readDirectionFromSession();
    if (!data?.direction) {
      router.replace("/compass");
      return;
    }
    setPayload(data);
  }, [router]);

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-md-surface px-4 md-body-medium text-md-on-surface-variant">
        Loading your direction…
      </div>
    );
  }

  const { direction, where_to_look: whereToLook, recipient, occasion } = payload;

  return (
    <main className="min-h-screen bg-md-surface px-4 pb-12 pt-6">
      <header className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <Link
          href="/compass"
          className="md-label-large text-md-on-surface-variant transition hover:text-md-primary"
        >
          ← Compass
        </Link>
        <span className="md-label-medium uppercase tracking-wide text-md-primary">
          Your direction
        </span>
        <Link
          href="/"
          className="md-label-large text-md-on-surface-variant transition hover:text-md-primary"
        >
          Home
        </Link>
      </header>

      <div className="mx-auto max-w-2xl">
        <DirectionCard
          direction={direction}
          whereToLook={whereToLook}
          onLoveIt={() => setCelebrate(true)}
          onGoDeeper={() => {
            const boot = buildCompassGoDeeperBootstrap(readDirectionFromSession());
            if (boot) {
              stashGoDeeperBootstrap(boot);
              writeChatBootstrapToSession(boot);
            }
            router.push("/chat?deep=1");
          }}
          onStartOver={() => {
            clearDirectionFromSession();
            router.push("/compass");
          }}
        />
      </div>

      <AnimatePresence>
        {celebrate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Celebration"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-sm rounded-[28px] border border-md-outline-variant bg-md-surface-container-high p-8 text-center shadow-md-direction"
            >
              <p className="text-3xl" aria-hidden>
                ✨
              </p>
              <p className="md-title-large mt-4 font-semibold text-md-on-surface">
                So glad this helped!
              </p>
              <p className="md-body-medium mt-2 text-md-on-surface-variant">
                Happy gifting — they’re lucky to have you.
              </p>
              <button
                type="button"
                onClick={() => setCelebrate(false)}
                className="md-label-large mt-6 w-full rounded-full bg-md-primary py-3 font-medium text-md-on-primary transition hover:brightness-110"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
