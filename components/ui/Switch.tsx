"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", checked, onCheckedChange, id, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={`
          peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
          border border-white/15 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5d67b]/50
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? "bg-[#f5d67b]" : "bg-white/10"}
          ${className}
        `.trim()}
      >
        <span
          className={`
            pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-200
            ${checked ? "translate-x-6 bg-black" : "translate-x-1 bg-white/70"}
          `.trim()}
        />
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

