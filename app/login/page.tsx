'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
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

  const handleGoogleSignIn = async () => {
    setError(null)
    setOauthLoading(true)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setOauthLoading(false)
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

        <div className="mt-10 space-y-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading || loading}
            className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {oauthLoading ? 'Connecting...' : 'Sign in with Google'}
          </button>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.45em] text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
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
            disabled={loading || oauthLoading}
            className="group relative mt-4 flex w-full justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}

