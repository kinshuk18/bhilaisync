import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type GlassCardVariant =
  | "default"
  | "elevated"
  | "sm"
  | "cyan"
  | "purple";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the visual weight and accent colour of the glass surface.
   *
   * • default  → glass-panel          standard frosted card
   * • elevated → glass-panel-elevated modal / drawer weight, heavier blur
   * • sm       → glass-panel-sm       subtle secondary surface, tags, badges
   * • cyan     → glass-panel-cyan     neon-cyan border accent
   * • purple   → glass-panel-purple   deep-purple border accent
   */
  variant?: GlassCardVariant;
  /**
   * When true the card gains a smooth hover-lift transform.
   * Defaults to false so static display cards stay grounded.
   */
  hoverable?: boolean;
  /**
   * Renders the card as a <section> for landmark semantics.
   * Defaults to false (renders a <div>).
   */
  asSection?: boolean;
}

// ---------------------------------------------------------------------------
// Variant → CSS class map
// We reference the utility classes defined in globals.css so there is a
// single source of truth for every glass surface in the design system.
// ---------------------------------------------------------------------------
const VARIANT_CLASS_MAP: Record<GlassCardVariant, string> = {
  default:  "glass-panel",
  elevated: "glass-panel-elevated",
  sm:       "glass-panel-sm",
  cyan:     "glass-panel-cyan",
  purple:   "glass-panel-purple",
};

// ---------------------------------------------------------------------------
// Component
// forwardRef lets parent components attach a ref to the underlying DOM node,
// which is necessary for Framer Motion layout animations and focus management.
// ---------------------------------------------------------------------------
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant   = "default",
      hoverable = false,
      asSection = false,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const resolvedClass = twMerge(
      clsx(
        // Base glass variant
        VARIANT_CLASS_MAP[variant],
        // Optional hover lift — pairs with the card-hover utility in globals.css
        hoverable && "card-hover cursor-pointer",
        // Consumer overrides — always last so they win the specificity race
        className
      )
    );

    const Tag = asSection ? "section" : "div";

    return (
      <Tag ref={ref as React.Ref<HTMLDivElement>} className={resolvedClass} {...rest}>
        {children}
      </Tag>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
