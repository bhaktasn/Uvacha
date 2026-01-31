"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5
          text-sm text-white placeholder:text-white/40
          transition-all duration-200
          focus:border-[#f5d67b]/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-[#f5d67b]/30
          disabled:pointer-events-none disabled:opacity-50
          ${className}
        `.trim()}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

