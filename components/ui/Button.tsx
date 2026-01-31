"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#f5d67b] bg-[#f5d67b] text-black shadow-[0_15px_40px_rgba(245,214,123,0.25)] hover:bg-[#ffe8a0] hover:-translate-y-0.5",
  secondary:
    "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white",
  ghost:
    "border-transparent bg-transparent text-white/70 hover:bg-white/5 hover:text-white",
  destructive:
    "border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:border-red-500/70",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-8 py-3 text-sm gap-2",
  icon: "p-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-full border
          font-semibold uppercase tracking-[0.15em] transition-all duration-200
          disabled:pointer-events-none disabled:opacity-50
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

