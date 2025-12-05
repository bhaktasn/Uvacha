'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push('/profile')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-[#f5d67b]/20 blur-[160px]" />
      </div>

      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/60 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">Welcome back</p>
          <h2 className="text-3xl font-semibold text-white">Sign in to Uvacha</h2>
          <p className="text-sm text-white/60">
            Don&apos;t have access yet?{" "}
            <Link href="/signup" className="text-[#f5d67b] underline decoration-transparent transition hover:decoration-[#f5d67b]/60">
              Create an account
            </Link>
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-[0.4em] text-white/60">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#f5d67b] focus:outline-none focus:ring-0"
              placeholder="you@studio.xyz"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-[0.4em] text-white/60">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#f5d67b] focus:outline-none focus:ring-0"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-4 flex w-full justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}

