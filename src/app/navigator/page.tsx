"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MessageRole = "user" | "ai";

interface Message {
  id:        string;
  role:      MessageRole;
  text:      string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const WELCOME_MESSAGE: Message = {
  id:        "welcome-msg",
  role:      "ai",
  text:
    "**Welcome to IIT Bhilai! 👋**\n\nI'm your **BhilaiSync AI Counselor** — here to help you navigate campus life, academic policies, events, and everything in between.\n\nWhether you're wondering about hostel procedures, course registration, Meraz registrations, or just where to grab the best chai on campus — ask away!\n\n*How can I help you today?*",
  timestamp: Date.now(),
};

const SUGGESTED_QUESTIONS = [
  "What are the hostel rules for freshers?",
  "How do I register for Meraz events?",
  "What is the attendance policy?",
  "How do I access the campus library?",
  "Tell me about the Tech Café timings.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateMsgId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// AI avatar mark
function AIAvatar() {
  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(0,229,255,0.25) 100%)",
        border:     "1px solid rgba(0,229,255,0.30)",
        boxShadow:  "0 0 12px rgba(0,229,255,0.18)",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M10 2L17 6V14L10 18L3 14V6L10 2Z"
          stroke="url(#av-grad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="rgba(0,229,255,0.08)"
        />
        <circle cx="10" cy="10" r="2" fill="url(#av-grad)" />
        <defs>
          <linearGradient id="av-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5FF" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// User avatar
function UserAvatar({ displayName }: { displayName: string }) {
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-700"
      style={{
        background: "linear-gradient(135deg, rgba(0,229,255,0.25) 0%, rgba(0,229,255,0.10) 100%)",
        border:     "1px solid rgba(0,229,255,0.35)",
        color:      "#00E5FF",
      }}
      aria-hidden="true"
    >
      {initials || "U"}
    </div>
  );
}

// Individual message bubble
interface MessageBubbleProps {
  message:     Message;
  displayName: string;
  index:       number;
}

function MessageBubble({ message, displayName, index }: MessageBubbleProps) {
  const isAI = message.role === "ai";

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{
        duration: 0.3,
        delay:    Math.min(index * 0.04, 0.2),
        ease:     [0.25, 0.46, 0.45, 0.94],
      }}
      className={`flex w-full gap-3 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {/* AI avatar — left side */}
      {isAI && <AIAvatar />}

      {/* Bubble */}
      <div
        className={`flex max-w-[75%] flex-col gap-1 ${isAI ? "items-start" : "items-end"}`}
      >
        {isAI ? (
          <GlassCard
            variant="default"
            className="px-4 py-3"
            style={{ borderRadius: "4px 16px 16px 16px" }}
          >
            <div
              className="ai-prose whitespace-pre-wrap text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: message.text
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g,     "<em>$1</em>")
                  .replace(/^- (.+)$/gm,     "<li>$1</li>")
                  .replace(/(<li>[\s\S]*<\/li>)/,(match) => `<ul>${match}</ul>`)
                  .replace(/`([^`]+)`/g,     "<code>$1</code>"),
              }}
            />
          </GlassCard>
        ) : (
          <div
            className="px-4 py-3 text-sm leading-relaxed"
            style={{
              background:   "linear-gradient(135deg, rgba(0,229,255,0.14) 0%, rgba(0,229,255,0.07) 100%)",
              border:       "1px solid rgba(0,229,255,0.28)",
              borderRadius: "16px 4px 16px 16px",
              color:        "rgba(255,255,255,0.92)",
              boxShadow:    "0 2px 12px rgba(0,229,255,0.10)",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Timestamp */}
        <span
          className="px-1 text-[10px] font-400 tracking-wide"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* User avatar — right side */}
      {!isAI && <UserAvatar displayName={displayName} />}
    </motion.div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: 8, transition: { duration: 0.15 } }}
      className="flex items-start gap-3"
    >
      <AIAvatar />
      <GlassCard
        variant="default"
        className="flex items-center gap-1 px-4 py-3"
        style={{ borderRadius: "4px 16px 16px 16px" }}
      >
        <div className="ai-thinking">
          <span />
          <span />
          <span />
        </div>
        <span
          className="ml-2 text-xs font-500"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          AI Counselor is thinking…
        </span>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Auth gate — shown when user is not signed in
// ---------------------------------------------------------------------------
interface AuthGateProps {
  signInWithGoogle: () => Promise<void>;
  authError:        string | null;
  clearAuthError:   () => void;
}

function AuthGate({ signInWithGoogle, authError, clearAuthError }: AuthGateProps) {
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <GlassCard variant="elevated" className="flex flex-col items-center gap-6 p-8 text-center">
          {/* Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(0,229,255,0.15) 100%)",
              border:     "1px solid rgba(0,229,255,0.25)",
              boxShadow:  "0 0 32px rgba(124,58,237,0.20)",
            }}
          >
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="h-10 w-10"
              aria-hidden="true"
            >
              <path
                d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
                stroke="url(#gate-grad)"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="rgba(0,229,255,0.06)"
              />
              <circle cx="24" cy="22" r="5" stroke="url(#gate-grad)" strokeWidth="2" />
              <path
                d="M14 36c0-5.5 4.5-9 10-9s10 3.5 10 9"
                stroke="url(#gate-grad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gate-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5FF" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-700 tracking-tight text-gradient-brand">
              Freshman Navigator
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Your personal AI counselor for IIT Bhilai — campus life, academic
              policies, events, and more. Sign in with your{" "}
              <span style={{ color: "#00E5FF" }}>@iitbhilai.ac.in</span> account
              to get started.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {["Campus Facilities", "Academic Policies", "Meraz & Events", "Admin Guidance"].map(
              (feat) => (
                <span key={feat} className="badge badge-purple text-[11px]">
                  {feat}
                </span>
              )
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{    opacity: 0, height: 0     }}
                className="w-full overflow-hidden"
              >
                <div
                  className="flex items-start gap-3 rounded-xl p-3 text-left text-xs leading-relaxed"
                  style={{
                    background: "rgba(248,113,113,0.10)",
                    border:     "1px solid rgba(248,113,113,0.25)",
                    color:      "#f87171",
                  }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    {authError}
                    <button
                      onClick={clearAuthError}
                      className="ml-2 underline opacity-70 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <NeonButton
            variant="solid-cyan"
            isLoading={signingIn}
            loadingLabel="Signing in…"
            onClick={handleSignIn}
            className="w-full py-3 text-base"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </NeonButton>

          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Restricted to @iitbhilai.ac.in accounts only
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function NavigatorPage() {
  const { user, userData, loading, authError, clearAuthError, signInWithGoogle } =
    useAuth();

  const [messages,  setMessages]  = useState<Message[]>([WELCOME_MESSAGE]);
  const [input,     setInput]     = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  // ── Focus input on mount (if signed in) ──────────────────────────────────
  useEffect(() => {
    if (user && !loading) {
      inputRef.current?.focus();
    }
  }, [user, loading]);

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      setFetchError(null);
      setInput("");

      // Append user message immediately for optimistic UI
      const userMsg: Message = {
        id:        generateMsgId(),
        role:      "user",
        text:      trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/navigator", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            query:     trimmed,
            studentId: user?.uid ?? "guest",
          }),
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(
            errData.error ?? `Server responded with status ${res.status}.`
          );
        }

        const data = (await res.json()) as { reply: string };

        const aiMsg: Message = {
          id:        generateMsgId(),
          role:      "ai",
          text:      data.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";

        setFetchError(message);

        // Add an in-chat error card so the conversation stays coherent
        const errorMsg: Message = {
          id:        generateMsgId(),
          role:      "ai",
          text:      `⚠️ **Sorry, I ran into an issue.**\n\n${message}\n\nPlease try again in a moment.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        // Re-focus input after response
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, isLoading, user]
  );

  // ── Suggested question click ──────────────────────────────────────────────
  const handleSuggestion = useCallback(
    (question: string) => {
      setInput(question);
      inputRef.current?.focus();
    },
    []
  );

  // ── Clear chat ────────────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setFetchError(null);
    inputRef.current?.focus();
  }, []);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-2xl animate-pulse"
            style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.30)" }}
          />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
            Initialising Navigator…
          </p>
        </div>
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AuthGate
        signInWithGoogle={signInWithGoogle}
        authError={authError}
        clearAuthError={clearAuthError}
      />
    );
  }

  // ── Main chat UI ──────────────────────────────────────────────────────────
  const displayName = userData?.displayName ?? user.displayName ?? "Student";

  return (
    <div
      className="flex min-h-[calc(100vh-65px)] flex-col"
      style={{ maxHeight: "calc(100dvh - 65px)" }}
    >
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1,  y: 0   }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex-shrink-0 border-b px-4 py-4 sm:px-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <AIAvatar />
            <div>
              <h1 className="text-base font-700 leading-tight text-gradient-brand">
                Freshman Navigator
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="dot-online" style={{ width: 6, height: 6 }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                  AI Counselor · Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User chip */}
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border:     "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <UserAvatar displayName={displayName} />
              <span className="text-xs font-500" style={{ color: "rgba(255,255,255,0.55)" }}>
                {displayName.split(" ")[0]}
              </span>
            </div>

            {/* Clear chat button */}
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 hover:bg-white/[0.06]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              aria-label="Clear conversation"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Suggested questions bar (visible only on empty history) ──────── */}
      <AnimatePresence>
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{    opacity: 0, height: 0     }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 overflow-hidden border-b px-4 py-3 sm:px-6"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="mx-auto max-w-3xl">
              <p className="mb-2 text-[11px] font-600 uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.28)" }}>
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <motion.button
                    key={q}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{  scale: 0.97 }}
                    onClick={() => handleSuggestion(q)}
                    className="rounded-full px-3 py-1.5 text-xs font-500 transition-all duration-150"
                    style={{
                      background: "rgba(0,229,255,0.06)",
                      border:     "1px solid rgba(0,229,255,0.18)",
                      color:      "rgba(0,229,255,0.80)",
                    }}
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="scroll-smooth-ios flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                displayName={displayName}
                index={idx}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator key="typing-indicator" />}
          </AnimatePresence>

          {/* Fetch error toast (non-critical, shown above the input) */}
          <AnimatePresence>
            {fetchError && (
              <motion.div
                initial={{ opacity: 0, y: 8  }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -8 }}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border:     "1px solid rgba(248,113,113,0.20)",
                  color:      "#f87171",
                }}
              >
                <span>Connection issue — your message was not delivered.</span>
                <button
                  onClick={() => setFetchError(null)}
                  className="flex-shrink-0 underline opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-0 w-full" aria-hidden="true" />
        </div>
      </div>

      {/* ── Sticky input bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex-shrink-0 border-t px-4 py-4 sm:px-6"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          background:  "rgba(8,9,13,0.70)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
          aria-label="Send a message to the AI Counselor"
        >
          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about IIT Bhilai…"
              className="glass-input pr-12"
              maxLength={2000}
              disabled={isLoading}
              aria-label="Your question"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                borderRadius: "16px",
                paddingTop:    "14px",
                paddingBottom: "14px",
              }}
            />

            {/* Character count — visible when approaching limit */}
            {input.length > 1600 && (
              <span
                className="absolute bottom-2 right-3 text-[10px] font-500 tabular-nums"
                style={{
                  color: input.length > 1900 ? "#f87171" : "rgba(255,255,255,0.30)",
                }}
              >
                {2000 - input.length}
              </span>
            )}
          </div>

          {/* Send button */}
          <NeonButton
            type="submit"
            variant="solid-cyan"
            isLoading={isLoading}
            loadingLabel=""
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="h-[50px] w-[50px] flex-shrink-0 rounded-2xl p-0"
            style={{ borderRadius: "16px" }}
          >
            {!isLoading && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            )}
          </NeonButton>
        </form>

        {/* Footer hint */}
        <p
          className="mx-auto mt-2.5 max-w-3xl text-center text-[11px]"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          Powered by Gemini 1.5 Flash · Responses may not reflect current IIT Bhilai policy ·
          Always verify with the Student Affairs office
        </p>
      </motion.div>
    </div>
  );
}
