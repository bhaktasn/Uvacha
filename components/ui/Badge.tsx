"use client";

import { forwardRef, type HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "gold";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-white/15 bg-white/5 text-white/70",
  secondary: "border-white/10 bg-white/[0.03] text-white/60",
  gold: "border-[#f5d67b]/30 bg-[#f5d67b]/10 text-[#f5d67b]",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-3 py-1
          text-[0.65rem] font-semibold uppercase tracking-[0.2em]
          ${variantClasses[variant]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

