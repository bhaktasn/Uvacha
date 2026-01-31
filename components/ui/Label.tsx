"use client";

import { forwardRef, type LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          block text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-2
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";

