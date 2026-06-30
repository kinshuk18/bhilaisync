"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type NeonButtonVariant = "cyan" | "purple" | "solid-cyan" | "ghost";

// We merge standard button HTML attributes with Framer Motion's motion props
// so consumers can pass both DOM event handlers and motion-specific props.
// We omit "ref" from HTMLMotionProps to avoid a conflict with forwardRef below.
type MotionButtonProps = Omit<HTMLMotionProps<"button">, "ref">;

export interface NeonButtonProps extends MotionButtonProps {
  /**
   * Visual style of the button.
   *
   * • cyan       → ghost-like neon cyan outline (primary action)
   * • purple     → ghost-like deep purple outline (secondary action)
   * • solid-cyan → filled solid cyan (high-emphasis CTA)
   * • ghost      → minimal outline, neutral colour (tertiary / cancel)
   */
  variant?: NeonButtonVariant;
  /**
   * When true the button is disabled and an animated spinner is rendered
   * to the left of the children. Use during async operations (API calls,
   * Firebase writes, etc.) to prevent duplicate submissions.
   */
  isLoading?: boolean;
  /**
   * Optional label shown next to the spinner while isLoading is true.
   * Falls back to rendering children when omitted.
   */
  loadingLabel?: string;
}

// ---------------------------------------------------------------------------
// Variant → CSS class map
// References the utility classes defined in globals.css.
// ---------------------------------------------------------------------------
const VARIANT_CLASS_MAP: Record<NeonButtonVariant, string> = {
  "cyan":       "btn-neon-cyan",
  "purple":     "btn-neon-purple",
  "solid-cyan": "btn-solid-cyan",
  "ghost":      "btn-ghost",
};

// ---------------------------------------------------------------------------
// SVG Spinner
// Inline to avoid an extra file and keep the component self-contained.
// The spinner colour adapts to the button variant via currentColor.
// ---------------------------------------------------------------------------
const Spinner = React.memo(function Spinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 flex-shrink-0 animate-spin"
      aria-hidden="true"
      role="presentation"
    >
      {/* Track circle */}
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* Spinning arc */}
      <path
        d="M10 2a8 8 0 018 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
});

// ---------------------------------------------------------------------------
// Framer Motion tap / hover configuration
// Defined outside the component to avoid recreating objects on every render.
// ---------------------------------------------------------------------------
const MOTION_WHILE_TAP    = { scale: 0.97 } as const;
const MOTION_WHILE_HOVER  = { scale: 1.02 } as const;
const MOTION_TRANSITION   = {
  type: "spring",
  stiffness: 400,
  damping:   20,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    {
      variant      = "cyan",
      isLoading    = false,
      loadingLabel,
      disabled,
      className,
      children,
      type         = "button",
      whileTap,
      whileHover,
      transition,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const resolvedClass = twMerge(
      clsx(
        // Core variant styles from globals.css
        VARIANT_CLASS_MAP[variant],
        // Disable pointer interactions & reduce opacity when loading/disabled.
        // The CSS utility classes already handle :disabled pseudo styles,
        // but we add these Tailwind classes as a belt-and-suspenders guard
        // for when `disabled` is not natively forwarded by motion.button.
        isDisabled && "pointer-events-none opacity-50",
        className
      )
    );

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        className={resolvedClass}
        // Allow caller to override motion props while keeping sensible defaults.
        whileTap={isDisabled ? undefined : (whileTap ?? MOTION_WHILE_TAP)}
        whileHover={isDisabled ? undefined : (whileHover ?? MOTION_WHILE_HOVER)}
        transition={transition ?? MOTION_TRANSITION}
        {...rest}
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              { (loadingLabel ?? children ?? "Loading…") as any }
            </span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export default NeonButton;
