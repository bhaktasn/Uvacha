"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", options, placeholder, value, ...props }, ref) => {
    return (
      <select
        ref={ref}
        value={value}
        className={`
          w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-2.5
          text-sm text-white
          transition-all duration-200 cursor-pointer
          focus:border-[#f5d67b]/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-[#f5d67b]/30
          disabled:pointer-events-none disabled:opacity-50
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")]
          bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10
          ${className}
        `.trim()}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#121212] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";

