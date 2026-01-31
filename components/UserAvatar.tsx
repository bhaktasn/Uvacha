'use client'

import Image from 'next/image'

interface UserAvatarProps {
  avatarUrl?: string | null
  username?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[0.5rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
} as const

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
} as const

export function UserAvatar({ avatarUrl, username, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = sizeClasses[size]
  const imageSize = imageSizes[size]
  
  // Generate initials from username
  const initials = username 
    ? username.slice(0, 2).toUpperCase()
    : '?'
  
  // Generate a consistent color based on username
  const getAvatarColor = (name: string | null | undefined) => {
    if (!name) return 'from-[#f5d67b]/30 to-[#c08f2c]/30'
    const colors = [
      'from-[#f5d67b]/40 to-[#c08f2c]/40',
      'from-purple-500/40 to-purple-700/40',
      'from-emerald-500/40 to-emerald-700/40',
      'from-blue-500/40 to-blue-700/40',
      'from-rose-500/40 to-rose-700/40',
      'from-amber-500/40 to-amber-700/40',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (avatarUrl) {
    return (
      <div className={`relative overflow-hidden rounded-full border border-white/10 ${sizeClass} ${className}`}>
        <Image
          src={avatarUrl}
          alt={username ? `${username}'s avatar` : 'User avatar'}
          width={imageSize}
          height={imageSize}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${getAvatarColor(username)} font-semibold text-white/80 ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  )
}

