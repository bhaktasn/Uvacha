'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'

type SiteSearchBarProps = {
  className?: string
  showShortcutHint?: boolean
}

const MIN_QUERY_LENGTH = 2

const isEditableElement = (element: EventTarget | null): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  if (element.isContentEditable) {
    return true
  }

  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
}

export default function SiteSearchBar({ className, showShortcutHint = false }: SiteSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [helperText, setHelperText] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pathname === '/search') {
      const currentQuery = searchParams?.get('q') ?? ''
      setQuery(currentQuery)
    }
  }, [pathname, searchParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !isEditableElement(event.target))
      ) {
        event.preventDefault()
        inputRef.current?.focus()
      }

      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
        setHelperText(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setHelperText(`Enter at least ${MIN_QUERY_LENGTH} characters`)
      return
    }

    setHelperText(null)
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const handleClear = () => {
    setQuery('')
    setHelperText(null)
    inputRef.current?.focus()
  }

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className={`group relative flex w-full max-w-2xl items-center rounded-full border ${
          isFocused ? 'border-[#f5d67b]/80' : 'border-white/15'
        } bg-white/5 px-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition focus-within:border-[#f5d67b]/80 focus-within:bg-white/10`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white/50"
          stroke="currentColor"
          strokeWidth={1.6}
          fill="none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search videos, creators, descriptions..."
          className="ml-3 w-full bg-transparent py-3 text-sm text-white placeholder-white/50 focus:outline-none"
          aria-label="Search videos"
          aria-keyshortcuts="Control+K Meta+K /"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-3 rounded-full p-1 text-white/50 transition hover:text-white"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth={1.6} fill="none">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          aria-label="Search videos"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5d67b]/90 text-black transition hover:bg-[#ffe8a0]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8} fill="none">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" strokeLinecap="round" />
          </svg>
        </button>
      </form>
      {showShortcutHint && (
        <p className="mt-1 text-center text-[0.65rem] uppercase tracking-[0.35em] text-white/40">
          Press <span className="rounded-full border border-white/20 px-1 py-0.5 text-white/70">Cmd K</span> or{' '}
          <span className="rounded-full border border-white/20 px-1 py-0.5 text-white/70">Ctrl K</span>
        </p>
      )}
      {helperText && (
        <p className="mt-2 text-center text-xs text-[#f1b24b]" role="status">
          {helperText}
        </p>
      )}
    </div>
  )
}

