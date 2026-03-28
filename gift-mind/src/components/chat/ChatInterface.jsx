"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import ChatBubble from "@/components/ui/ChatBubble.jsx";
import TypingIndicator from "@/components/ui/TypingIndicator.jsx";
import {
  readDirectionFromSession,
  peekChatBootstrapFromSession,
  clearChatBootstrapFromSession,
  writeDirectionToSession,
} from "@/lib/compass-session.js";
import {
  peekGoDeeperBootstrap,
  clearGoDeeperBootstrap,
  beginGoDeeperSessionPost,
  endGoDeeperSessionPost,
} from "@/lib/deep-bootstrap-bridge.js";
import { friendlyChatError } from "@/lib/friendly-errors.js";
import {
  buildInitialAssistantContent,
  defaultChatContextFromParams,
  extractSseEvents,
  shouldOfferSynthesizeFromAssistantMessage,
} from "@/lib/chat-stream.js";
import { assistantMessageContainsParsableDirection } from "@/lib/parse-direction-json.js";

function completeMessagesForApi(messages) {
  return messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        !m.streaming &&
        String(m.content || "").trim().length > 0
    )
    .map(({ role, content }) => ({ role, content }));
}

function messagesToSeedPayload(msgs) {
  return msgs
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        !m.streaming &&
        String(m.content || "").trim().length > 0
    )
    .map(({ role, content, hidden }) => ({
      role,
      content: String(content).trim(),
      hidden: Boolean(hidden),
    }));
}

const DIRECTION_LEAK_PLACEHOLDER =
  "I’ve drafted your gift direction — tap Generate gift direction below to open your full card (headline, note, and where to look).";

async function postSession(body) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rp = searchParams.get("recipient") ?? "";
  const op = searchParams.get("occasion") ?? "";

  const [recipient, setRecipient] = useState("someone you care about");
  const [occasion, setOccasion] = useState("this moment");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const skipDefaultChatInitRef = useRef(false);
  const sessionIdRef = useRef(null);
  const initDoneRef = useRef(Promise.resolve());
  /** Ignores stale async results when React Strict Mode remounts quickly. */
  const sessionInitGenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let resolveInit = () => {};
    initDoneRef.current = new Promise((r) => {
      resolveInit = r;
    });
    const gen = ++sessionInitGenRef.current;

    const applySessionResponse = (result) => {
      if (gen !== sessionInitGenRef.current) return;
      const { ok, data } = result;
      if (ok && data?.id) {
        sessionIdRef.current = data.id;
        return;
      }
      if (!ok && data?.error) {
        console.warn("[GiftMind] /api/session failed:", data.error);
        return;
      }
      if (ok && data?.persistence === "off") {
        if (process.env.NODE_ENV === "development") {
          console.info(
            "[GiftMind] Supabase persistence off — add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to gift-mind/.env.local and restart dev from the gift-mind folder."
          );
        }
      }
    };

    (async () => {
      try {
        const deep = searchParams.get("deep");
        /** Bridge survives React Strict Mode; storage is peeked (not cleared) until seed succeeds. */
        const boot =
          peekGoDeeperBootstrap() || (deep === "1" ? peekChatBootstrapFromSession() : null);

        if (boot?.initialMessages?.length) {
          const ctx = defaultChatContextFromParams(boot.recipient, boot.occasion);
          if (!cancelled) {
            setRecipient(ctx.recipient);
            setOccasion(ctx.occasion);
            setMessages(boot.initialMessages);
          }
          skipDefaultChatInitRef.current = true;
          if (deep === "1") {
            router.replace(
              `/chat?recipient=${encodeURIComponent(boot.recipient)}&occasion=${encodeURIComponent(boot.occasion)}`,
              { scroll: false }
            );
          }
          if (beginGoDeeperSessionPost()) {
            try {
              const dir = readDirectionFromSession();
              const result = await postSession({
                recipient: boot.recipient,
                occasion: boot.occasion,
                messages: messagesToSeedPayload(boot.initialMessages),
                compassSelections: dir?.compass_selections ?? undefined,
              });
              applySessionResponse(result);
            } finally {
              clearGoDeeperBootstrap();
              clearChatBootstrapFromSession();
              endGoDeeperSessionPost();
            }
          }
          return;
        }
        if (skipDefaultChatInitRef.current) {
          skipDefaultChatInitRef.current = false;
          return;
        }
        sessionIdRef.current = null;
        const ctx = defaultChatContextFromParams(rp, op);
        if (!cancelled) {
          setRecipient(ctx.recipient);
          setOccasion(ctx.occasion);
          const openerMsg = {
            role: "assistant",
            content: buildInitialAssistantContent(rp, op),
            streaming: false,
          };
          setMessages([openerMsg]);
          const dir = readDirectionFromSession();
          const result = await postSession({
            recipient: rp || ctx.recipient,
            occasion: op || ctx.occasion,
            messages: messagesToSeedPayload([openerMsg]),
            compassSelections: dir?.compass_selections ?? undefined,
          });
          applySessionResponse(result);
        }
      } finally {
        resolveInit();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rp, op, searchParams, router]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const showSynthesize = useMemo(() => {
    const hasVisibleUserTurn = messages.some(
      (m) =>
        m.role === "user" &&
        !m.hidden &&
        !m.streaming &&
        String(m.content || "").trim().length > 0
    );
    if (!hasVisibleUserTurn) return false;

    const last = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          !m.hidden &&
          !m.streaming &&
          String(m.content || "").trim().length > 0
      );
    return last ? shouldOfferSynthesizeFromAssistantMessage(last.content) : false;
  }, [messages]);

  const lastVisibleAssistantIndex = useMemo(() => {
    let idx = -1;
    messages.forEach((m, i) => {
      if (
        m.role === "assistant" &&
        !m.hidden &&
        !m.streaming &&
        String(m.content || "").trim().length > 0
      ) {
        idx = i;
      }
    });
    return idx;
  }, [messages]);

  const showTypingRow =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.streaming &&
    String(messages[messages.length - 1]?.content || "").length === 0;

  const finalizeAssistantError = useCallback((errMessage) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant" && last.streaming) {
        next[next.length - 1] = {
          role: "assistant",
          content: errMessage,
          streaming: false,
        };
      }
      return next;
    });
  }, []);

  const sendUserMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || isSynthesizing) return;

    setError(null);
    setInput("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    await initDoneRef.current;
    const sid = sessionIdRef.current;

    const history = completeMessagesForApi(messages);
    const apiMessages = [...history, { role: "user", content: text }];

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, streaming: false },
      { role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    let accumulated = "";

    const flushUi = () => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          next[next.length - 1] = {
            role: "assistant",
            content: accumulated,
            streaming: true,
          };
        }
        return next;
      });
    };

    const payload =
      sid != null
        ? { sessionId: sid, userMessage: text, recipient, occasion }
        : { messages: apiMessages, recipient, occasion };

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }
        if (value) buffer += decoder.decode(value, { stream: true });

        const { events, rest } = extractSseEvents(buffer);
        buffer = rest;
        for (const e of events) {
          if (e.type === "text") accumulated += e.text;
        }
        flushUi();
      }

      let { events, rest } = extractSseEvents(buffer);
      for (const e of events) {
        if (e.type === "text") accumulated += e.text;
      }
      buffer = rest;
      if (buffer.trim()) {
        const again = extractSseEvents(buffer + "\n\n");
        for (const e of again.events) {
          if (e.type === "text") accumulated += e.text;
        }
      }

      flushUi();

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          next[next.length - 1] = {
            role: "assistant",
            content: accumulated,
            streaming: false,
          };
        }
        return next;
      });
    } catch (e) {
      if (e?.name === "AbortError") {
        setInput(text);
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]?.role === "assistant" && next[next.length - 1].streaming) {
            next.pop();
          }
          if (next[next.length - 1]?.role === "user") {
            next.pop();
          }
          return next;
        });
        return;
      }
      setError(friendlyChatError(e, "stream"));
      finalizeAssistantError(
        "I couldn’t finish that reply. Your message is back in the box — try sending again when you’re ready."
      );
    } finally {
      setIsStreaming(false);
    }
  }, [
    finalizeAssistantError,
    input,
    isStreaming,
    isSynthesizing,
    messages,
    recipient,
    occasion,
  ]);

  const runSynthesize = useCallback(async () => {
    if (isStreaming || isSynthesizing) return;
    setError(null);
    setIsSynthesizing(true);
    try {
      await initDoneRef.current;
      const sid = sessionIdRef.current;

      const apiMessages = completeMessagesForApi(messages);
      const hasVisibleUser = messages.some(
        (m) =>
          m.role === "user" &&
          !m.hidden &&
          !m.streaming &&
          String(m.content || "").trim().length > 0
      );
      if (!hasVisibleUser || apiMessages.length < 2) {
        throw new Error("Chat a little more with GiftMind, then tap generate again.");
      }
      const prior = readDirectionFromSession();
      const res = await fetch("/api/chat/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          recipient,
          occasion,
          ...(sid != null ? { sessionId: sid } : {}),
          ...(prior?.compass_selections ? { compassSelections: prior.compass_selections } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      if (!data.direction) {
        throw new Error("No direction returned.");
      }
      writeDirectionToSession({
        direction: data.direction,
        where_to_look: data.where_to_look || [],
        recipient,
        occasion,
        ...(prior?.compass_selections ? { compass_selections: prior.compass_selections } : {}),
        chat_transcript: apiMessages,
      });
      router.push("/chat/result");
    } catch (e) {
      setError(friendlyChatError(e, "synthesize"));
    } finally {
      setIsSynthesizing(false);
    }
  }, [isStreaming, isSynthesizing, messages, recipient, occasion, router]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-md-surface">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-md-outline-variant bg-md-surface-container-low px-3 sm:px-4">
        <Link
          href="/"
          aria-label="Back to home"
          className="flex h-10 w-10 items-center justify-center rounded-full text-md-on-surface-variant transition hover:bg-md-surface-container hover:text-md-primary"
        >
          ←
        </Link>
        <div className="flex flex-1 items-center justify-center gap-1 pr-10">
          <span className="md-title-medium font-medium text-md-primary">GiftMind</span>
          <span className="text-md-on-surface-variant" aria-hidden>
            💬
          </span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 py-2"
      >
        {messages.map((m, i) => {
          if (m.hidden) return null;
          if (m.role === "assistant" && m.streaming && !m.content) return null;
          const leak =
            m.role === "assistant" &&
            i === lastVisibleAssistantIndex &&
            assistantMessageContainsParsableDirection(m.content);
          return (
            <ChatBubble
              key={i}
              role={m.role}
              content={leak ? DIRECTION_LEAK_PLACEHOLDER : m.content}
              isStreaming={Boolean(m.streaming)}
            />
          );
        })}
        {showTypingRow ? (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          className="mx-auto w-full max-w-lg px-4 pb-2 text-center md-body-medium font-medium text-md-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 border-t border-md-outline-variant bg-md-surface-container-low px-4 py-3">
        <div className="mx-auto w-full max-w-lg">
          {showSynthesize ? (
            <motion.button
              type="button"
              disabled={isStreaming || isSynthesizing}
              onClick={runSynthesize}
              className="md-title-medium w-full rounded-[28px] bg-md-primary py-4 font-medium text-md-on-primary transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
              animate={{
                boxShadow: [
                  "0 0 24px rgba(168, 218, 181, 0.1)",
                  "0 0 36px rgba(168, 218, 181, 0.25)",
                  "0 0 24px rgba(168, 218, 181, 0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {isSynthesizing ? "Crafting your direction…" : "Generate gift direction ✨"}
            </motion.button>
          ) : (
            <div className="flex items-end gap-2.5">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Share a thought…"
                disabled={isStreaming || isSynthesizing}
                className="md-body-large min-h-[44px] flex-1 resize-none rounded-[28px] border-[1.5px] border-md-outline-variant bg-md-surface-container px-5 py-3 text-md-on-surface placeholder:text-md-outline focus:border-md-primary focus:outline-none focus:ring-2 focus:ring-[rgba(168,218,181,0.2)] disabled:opacity-40"
              />
              <motion.button
                type="button"
                disabled={isStreaming || isSynthesizing || !input.trim()}
                onClick={sendUserMessage}
                whileTap={{ scale: 0.95 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-md-primary text-lg font-semibold text-md-on-primary transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Send message"
              >
                →
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
