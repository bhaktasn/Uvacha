"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3
          text-sm text-white placeholder:text-white/40
          transition-all duration-200 resize-y min-h-[80px]
          focus:border-[#f5d67b]/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-[#f5d67b]/30
          disabled:pointer-events-none disabled:opacity-50
          ${className}
        `.trim()}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

