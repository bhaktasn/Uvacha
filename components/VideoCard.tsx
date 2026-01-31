'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { UserAvatar } from '@/components/UserAvatar'
import { getMuxThumbnailUrl } from '@/lib/mux/thumbnails'

interface VideoCardProps {
  id: string
  title: string
  createdAt: string
  generationSource: 'ai' | 'human'
  muxPlaybackId: string | null
  creatorUsername: string | null
  creatorAvatarUrl?: string | null
  description?: string
  viewCount?: number
  showDescription?: boolean
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatCreatorHandle = (username: string | null) =>
  username ? `@${username}` : 'Unknown creator'

export function VideoCard({
  id,
  title,
  createdAt,
  generationSource,
  muxPlaybackId,
  creatorUsername,
  creatorAvatarUrl,
  description,
  viewCount,
  showDescription = false,
}: VideoCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/videos/${id}`)
  }

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (creatorUsername) {
      router.push(`/u/${creatorUsername}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group flex cursor-pointer flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-[#f5d67b]/60"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        {muxPlaybackId ? (
          <div className="relative aspect-video w-full">
            <Image
              src={
                getMuxThumbnailUrl(muxPlaybackId, {
                  width: 640,
                  height: 360,
                  time: 2,
                })!
              }
              alt={`Preview for ${title}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-[radial-gradient(circle_at_top,_rgba(245,214,123,0.25),_transparent_55%)] transition duration-200 group-hover:scale-[1.02]" />
        )}
        <span className="absolute bottom-3 left-0 flex items-center gap-2 rounded-r-full bg-black/70 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
          {generationSource === 'ai' ? 'AI' : 'Human'}
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        <h3 className="line-clamp-2 text-lg font-semibold text-white">{title}</h3>
        
        {showDescription && description && (
          <p className="line-clamp-2 text-sm text-white/60">{description}</p>
        )}
        
        <button
          type="button"
          onClick={handleCreatorClick}
          className="flex items-center gap-2 text-left group/creator"
        >
          <UserAvatar
            avatarUrl={creatorAvatarUrl}
            username={creatorUsername}
            size="xs"
          />
          <span className="text-sm text-white/60 group-hover/creator:text-[#f5d67b] transition">
            {formatCreatorHandle(creatorUsername)}
          </span>
        </button>
        
        <div className="mt-auto flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/40">
          {viewCount !== undefined && (
            <>
              <span>{viewCount.toLocaleString()} views</span>
              <span className="text-white/20">•</span>
            </>
          )}
          <span>{dateFormatter.format(new Date(createdAt))}</span>
        </div>
      </div>
    </div>
  )
}

