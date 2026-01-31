'use client'

import { useState } from 'react'

interface VideoPromptDropdownProps {
  prompt: string | null
}

export function VideoPromptDropdown({ prompt }: VideoPromptDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!prompt) {
    return null
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
          <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
          <path d="M19 11h2m-1 -1v2" />
        </svg>
        <span>View AI Prompt</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-purple-300/70">Generation Prompt</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{prompt}</p>
        </div>
      </div>
    </div>
  )
}

