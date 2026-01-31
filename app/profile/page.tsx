'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateUSDCAddress } from '@/lib/utils/wallet-validation'
import { isValidTwitterHandle, isValidInstagramHandle, normalizeSocialHandle } from '@/lib/utils/social-validation'
import { UserAvatar } from '@/components/UserAvatar'

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/i
const MAX_BIO_LENGTH = 500

const normalizeUsername = (value: string) => value.trim().toLowerCase()
const isValidUsername = (value: string) => USERNAME_REGEX.test(value.trim())

interface Profile {
  id: string
  email: string
  username: string | null
  usdc_wallet_address: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  
  const [walletAddress, setWalletAddress] = useState('')
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletChain, setWalletChain] = useState<string | null>(null)
  
  const [twitterHandle, setTwitterHandle] = useState('')
  const [twitterError, setTwitterError] = useState<string | null>(null)
  
  const [instagramHandle, setInstagramHandle] = useState('')
  const [instagramError, setInstagramError] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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
      setBio(data.bio || '')
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

  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    setImageError(null)
    
    if (type === 'avatar') {
      setUploadingAvatar(true)
    } else {
      setUploadingBanner(true)
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update local state with new URL
      setProfile((prev) => prev ? {
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: result.url,
      } : null)

      setSuccess(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`)
    } catch (err) {
      console.error('Upload error:', err)
      setImageError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      if (type === 'avatar') {
        setUploadingAvatar(false)
      } else {
        setUploadingBanner(false)
      }
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, 'avatar')
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, 'banner')
    }
  }

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

      const updatePayload: Record<string, string | null> = {
        username: normalizeUsername(trimmedUsername),
        usdc_wallet_address: walletAddress.trim() || null,
        twitter_handle: twitterHandle ? normalizeSocialHandle(twitterHandle.trim()) : null,
        instagram_handle: instagramHandle ? normalizeSocialHandle(instagramHandle.trim()) : null,
        updated_at: new Date().toISOString(),
      }

      if (profile && Object.prototype.hasOwnProperty.call(profile, 'bio')) {
        updatePayload.bio = bio.trim() || null
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)

      if (updateError) {
        if (updateError.code === '23505') {
          setUsernameError('That username is already taken.')
          setError('Please choose a different username')
        } else {
          setError(updateError.message || 'Failed to update profile')
        }
        console.error('Update error:', updateError, JSON.stringify(updateError))
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
            {profile?.username && (
              <Link
                href={`/u/${profile.username}`}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
              >
                View Public Profile
              </Link>
            )}
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

        {/* Profile Images Section */}
        <div className="rounded-[2rem] border border-white/10 bg-black/60 p-8 shadow-[0_25px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <h2 className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">Profile Images</h2>
          
          {/* Banner Upload */}
          <div className="mt-6">
            <label className="text-xs uppercase tracking-[0.4em] text-white/60">
              Banner Image
            </label>
            <div className="mt-3 relative">
              <div 
                className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/10 cursor-pointer transition hover:border-[#f5d67b]/40"
                onClick={() => bannerInputRef.current?.click()}
              >
                {profile?.banner_url ? (
                  <Image
                    src={profile.banner_url}
                    alt="Profile banner"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#050505]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(245,214,123,0.15),_transparent_50%)]" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                  <span className="text-sm font-semibold text-white">
                    {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                  </span>
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleBannerChange}
                className="hidden"
                disabled={uploadingBanner}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Recommended: 1500×500 pixels. Max 5MB. JPEG, PNG, WebP, or GIF.
            </p>
          </div>

          {/* Avatar Upload */}
          <div className="mt-6">
            <label className="text-xs uppercase tracking-[0.4em] text-white/60">
              Avatar
            </label>
            <div className="mt-3 flex items-center gap-6">
              <div 
                className="relative cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="rounded-full border-2 border-white/10 transition hover:border-[#f5d67b]/40">
                  <UserAvatar
                    avatarUrl={profile?.avatar_url}
                    username={profile?.username}
                    size="xl"
                    className="h-24 w-24"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </button>
                <p className="mt-2 text-xs text-white/40">
                  Square image recommended. Max 5MB.
                </p>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>
          </div>

          {imageError && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {imageError}
            </div>
          )}
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
                3-24 characters, lowercase letters, numbers, and underscores only. We'll store it lowercase for consistency.
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="text-xs uppercase tracking-[0.4em] text-white/60">
                Bio <span className="text-white/30">(optional)</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                placeholder="Tell the world about yourself..."
                rows={3}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f5d67b] focus:outline-none focus:ring-0"
              />
              <p className="mt-2 text-xs text-white/40">
                {bio.length}/{MAX_BIO_LENGTH} characters
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
