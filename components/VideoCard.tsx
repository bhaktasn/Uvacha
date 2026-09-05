'use client'

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import { UserAvatar } from '@/components/UserAvatar'
import { getMuxThumbnailUrl } from '@/lib/mux/thumbnails'

const PreviewPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

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
  const [preview, setPreview] = useState(false)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thumbnail = useRef<HTMLAnchorElement>(null)
  const stopPreview = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setPreview(false)
    setPlaying(false)
  }
  const startPreview = () => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (!muxPlaybackId || connection?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPreview(true); timer.current = null }, 200)
  }
  useEffect(() => {
    const stop = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      setPreview(false)
      setPlaying(false)
    }
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop() })
    if (thumbnail.current) observer.observe(thumbnail.current)
    const onVisibility = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <article
      className="video-preview-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:border-[#f5d67b]/50"
    >
      <Link ref={thumbnail} href={`/videos/${id}`} aria-label={`Watch ${title}`} className="video-thumbnail relative block overflow-hidden" onMouseEnter={startPreview} onMouseLeave={stopPreview} onFocus={startPreview} onBlur={stopPreview}>
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
            {preview && <div className={`hover-preview ${playing ? 'is-playing' : ''}`} inert aria-hidden="true"><PreviewPlayer
              className="h-full w-full"
              playbackId={muxPlaybackId}
              streamType="on-demand"
              maxResolution="720p"
              autoPlay="muted"
              muted
              loop
              playsInline
              noVolumePref
              noMutedPref
              disableTracking
              preload="auto"
              onPlaying={() => setPlaying(true)}
              onError={stopPreview}
            /></div>}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-[radial-gradient(circle_at_top,_rgba(245,214,123,0.25),_transparent_55%)] transition duration-200 group-hover:scale-[1.02]" />
        )}
        <span className="absolute bottom-3 left-3 rounded bg-black/65 px-2 py-1 text-[10px] font-medium tracking-widest text-white/85 backdrop-blur-sm">
          {generationSource === 'ai' ? 'AI' : 'Human'}
        </span>
        <span className="thumbnail-play" aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
        {playing && <span className="preview-caption" aria-hidden="true">Muted preview</span>}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-white"><Link href={`/videos/${id}`}>{title}</Link></h3>
        
        {showDescription && description && (
          <p className="line-clamp-2 text-sm text-white/60">{description}</p>
        )}
        
        <Link
          href={creatorUsername ? `/u/${creatorUsername}` : `/videos/${id}`}
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
        </Link>
        
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
    </article>
  )
}
