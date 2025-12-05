'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateUSDCAddress } from '@/lib/utils/wallet-validation'
import { isValidTwitterHandle, isValidInstagramHandle, normalizeSocialHandle } from '@/lib/utils/social-validation'

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/i

const normalizeUsername = (value: string) => value.trim().toLowerCase()
const isValidUsername = (value: string) => USERNAME_REGEX.test(value.trim())

interface Profile {
  id: string
  email: string
  username: string | null
  usdc_wallet_address: string | null
  twitter_handle: string | null
  instagram_handle: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  
  const [walletAddress, setWalletAddress] = useState('')
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletChain, setWalletChain] = useState<string | null>(null)
  
  const [twitterHandle, setTwitterHandle] = useState('')
  const [twitterError, setTwitterError] = useState<string | null>(null)
  
  const [instagramHandle, setInstagramHandle] = useState('')
  const [instagramError, setInstagramError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setError('Failed to load profile')
        return
      }

      setProfile(data)
      setUsername(data.username || '')
      setWalletAddress(data.usdc_wallet_address || '')
      setTwitterHandle(data.twitter_handle || '')
      setInstagramHandle(data.instagram_handle || '')
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleWalletChange = (value: string) => {
    setWalletAddress(value)
    setWalletError(null)
    setWalletChain(null)

    if (value.trim() === '') {
      return
    }

    const validation = validateUSDCAddress(value)
    if (!validation.isValid) {
      setWalletError(validation.error || 'Invalid wallet address')
    } else {
      setWalletChain(validation.chain || null)
    }
  }

  const handleTwitterChange = (value: string) => {
    setTwitterHandle(value)
    setTwitterError(null)

    if (value.trim() === '' || isValidTwitterHandle(value)) {
      setTwitterError(null)
    } else {
      setTwitterError('Invalid Twitter handle (1-15 characters, alphanumeric and underscores only)')
    }
  }

  const handleInstagramChange = (value: string) => {
    setInstagramHandle(value)
    setInstagramError(null)

    if (value.trim() === '' || isValidInstagramHandle(value)) {
      setInstagramError(null)
    } else {
      setInstagramError('Invalid Instagram handle (1-30 characters, cannot end with a period)')
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setUsernameError(null)

    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    if (!isValidUsername(trimmed)) {
      setUsernameError('Usernames must be 3-24 characters and can include letters, numbers, and underscores')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate all fields before submitting
    if (walletAddress && !validateUSDCAddress(walletAddress).isValid) {
      setError('Please fix the wallet address error before saving')
      return
    }

    if (twitterHandle && !isValidTwitterHandle(twitterHandle)) {
      setError('Please fix the Twitter handle error before saving')
      return
    }

    if (instagramHandle && !isValidInstagramHandle(instagramHandle)) {
      setError('Please fix the Instagram handle error before saving')
      return
    }

    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setUsernameError('Username is required')
      setError('Please choose a username before saving')
      return
    }

    if (!isValidUsername(trimmedUsername)) {
      setUsernameError('Usernames must be 3-24 characters and can include letters, numbers, and underscores')
      setError('Please fix the username error before saving')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: normalizeUsername(trimmedUsername),
          usdc_wallet_address: walletAddress.trim() || null,
          twitter_handle: twitterHandle ? normalizeSocialHandle(twitterHandle.trim()) : null,
          instagram_handle: instagramHandle ? normalizeSocialHandle(instagramHandle.trim()) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        setError('Failed to update profile')
        console.error('Update error:', updateError)
        return
      }

      setSuccess('Profile updated successfully!')
      await loadProfile()
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-white/60">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-6 top-10 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[#f5b047]/15 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-[0_25px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">Control room</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">My profile</h1>
            <p className="text-sm text-white/60">
              Wallets, socials, and account preferences in one luxe panel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/videos"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Videos
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-300 transition hover:border-red-400 hover:text-red-200"
            >
              Logout
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-[2rem] border border-white/10 bg-black/60 p-8 shadow-[0_25px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          <div className="grid gap-6">
            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-white/60">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              />
            </div>

            <div>
              <label htmlFor="username" className="text-xs uppercase tracking-[0.4em] text-white/60">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="creative_handle"
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-0 ${
                  usernameError
                    ? 'border-red-400/60 focus:border-red-300'
                    : 'border-white/15 focus:border-[#f5d67b]'
                }`}
              />
              {usernameError && (
                <p className="mt-2 text-sm text-red-300">{usernameError}</p>
              )}
              {!usernameError && username && (
                <p className="mt-2 text-sm text-emerald-300">✓ Format looks good</p>
              )}
              <p className="mt-2 text-xs text-white/40">
                3-24 characters, lowercase letters, numbers, and underscores only. We’ll store it lowercase for consistency.
              </p>
            </div>

            <div>
              <label htmlFor="wallet" className="text-xs uppercase tracking-[0.4em] text-white/60">
                USDC wallet <span className="text-white/30">(optional)</span>
              </label>
              <input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => handleWalletChange(e.target.value)}
                placeholder="0x... or Solana address"
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-0 ${
                  walletError
                    ? 'border-red-400/60 focus:border-red-300'
                    : 'border-white/15 focus:border-[#f5d67b]'
                }`}
              />
              {walletError && (
                <p className="mt-2 text-sm text-red-300">{walletError}</p>
              )}
              {walletChain && !walletError && walletAddress && (
                <p className="mt-2 text-sm text-emerald-300">
                  ✓ Valid {walletChain === 'ethereum' ? 'Ethereum/EVM' : 'Solana'} address
                </p>
              )}
              <p className="mt-2 text-xs text-white/40">
                Supports Ethereum, Polygon, Solana, and other EVM compatible chains.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="twitter" className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Twitter / X <span className="text-white/30">(optional)</span>
                </label>
                <div className="mt-3 relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                    @
                  </span>
                  <input
                    id="twitter"
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => handleTwitterChange(e.target.value)}
                    placeholder="username"
                    className={`w-full rounded-2xl border px-4 py-3 pl-9 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-0 ${
                      twitterError
                        ? 'border-red-400/60 focus:border-red-300'
                        : 'border-white/15 focus:border-[#f5d67b]'
                    }`}
                  />
                </div>
                {twitterError && (
                  <p className="mt-2 text-sm text-red-300">{twitterError}</p>
                )}
                {!twitterError && twitterHandle && (
                  <p className="mt-2 text-sm text-emerald-300">✓ Valid Twitter handle</p>
                )}
              </div>

              <div>
                <label htmlFor="instagram" className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Instagram <span className="text-white/30">(optional)</span>
                </label>
                <div className="mt-3 relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                    @
                  </span>
                  <input
                    id="instagram"
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => handleInstagramChange(e.target.value)}
                    placeholder="username"
                    className={`w-full rounded-2xl border px-4 py-3 pl-9 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-0 ${
                      instagramError
                        ? 'border-red-400/60 focus:border-red-300'
                        : 'border-white/15 focus:border-[#f5d67b]'
                    }`}
                  />
                </div>
                {instagramError && (
                  <p className="mt-2 text-sm text-red-300">{instagramError}</p>
                )}
                {!instagramError && instagramHandle && (
                  <p className="mt-2 text-sm text-emerald-300">✓ Valid Instagram handle</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={
              saving ||
              !username.trim() ||
              !!usernameError ||
              !!walletError ||
              !!twitterError ||
              !!instagramError
            }
            className="mt-4 flex w-full justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

