'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type VideoRow = Database['public']['Tables']['videos']['Row']

const defaultCompetitionDateValue = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const competitionDateToMidnightIso = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number)

  if (!year || !month || !day) {
    return new Date().toISOString()
  }

  const midnightLocal = new Date(year, month - 1, day, 0, 0, 0)
  return midnightLocal.toISOString()
}

const parseDateValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return { year, month, day }
}

const formatDateForDisplay = (value: string) => {
  const parsed = parseDateValue(value)
  if (!parsed) {
    return ''
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return formatter.format(new Date(parsed.year, parsed.month - 1, parsed.day))
}

const isDateBeforeToday = (value: string) => {
  const parsed = parseDateValue(value)
  if (!parsed) {
    return true
  }

  const candidate = new Date(parsed.year, parsed.month - 1, parsed.day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return candidate < today
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DUPLICATE_COMPETITION_DAY_ERROR = 'You already have a video competing on this date. Choose a different competition day.'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isoStringToDateInput = (isoString: string) => {
  if (!isoString) {
    return defaultCompetitionDateValue()
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return defaultCompetitionDateValue()
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function VideosPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const initialCompetitionDateRef = useRef(defaultCompetitionDateValue())

  const [initialized, setInitialized] = useState(false)
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoRow | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    prompt: '',
    generationSource: 'human' as 'ai' | 'human',
    competitionDate: defaultCompetitionDateValue(),
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    prompt: '',
    generationSource: 'human' as 'ai' | 'human',
    competitionDate: initialCompetitionDateRef.current,
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const parsed = parseDateValue(initialCompetitionDateRef.current)
    return parsed ? new Date(parsed.year, parsed.month - 1, 1) : new Date()
  })
  const calendarRef = useRef<HTMLDivElement | null>(null)

  const fieldClass =
    'mt-3 w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#f5d67b] focus:outline-none focus:ring-0'
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const firstWeekdayIndex = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const totalDaysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const todayString = defaultCompetitionDateValue()
  const editingCompetitionIsPast = editingVideo ? isDateBeforeToday(isoStringToDateInput(editingVideo.unlock_at)) : false

  const loadVideos = async () => {
    try {
      setLoadingVideos(true)
      setLibraryError(null)
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err) {
      console.error('Failed to load videos', err)
      setLibraryError('Failed to load videos. Please try again.')
    } finally {
      setLoadingVideos(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadVideos()
      setInitialized(true)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showCalendar) {
      return undefined
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar])

  useEffect(() => {
    const parsed = parseDateValue(form.competitionDate)
    if (!parsed) {
      return
    }

    setCalendarMonth((prev) => {
      if (prev.getFullYear() === parsed.year && prev.getMonth() === parsed.month - 1) {
        return prev
      }

      return new Date(parsed.year, parsed.month - 1, 1)
    })
  }, [form.competitionDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      prompt: '',
      generationSource: 'human',
      competitionDate: defaultCompetitionDateValue(),
    })
    setFile(null)
    setShowCalendar(false)
  }

  const handleCompetitionDateSelection = (dateString: string) => {
    if (isDateBeforeToday(dateString)) {
      return
    }

    setForm((prev) => ({
      ...prev,
      competitionDate: dateString,
    }))
    setShowCalendar(false)
  }

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus(null)

    if (!file) {
      setError('Please choose a video file before uploading.')
      return
    }

    setIsSubmitting(true)
    try {
      setStatus('Creating upload session…')
      const normalizedCompetitionDate =
        form.competitionDate && !isDateBeforeToday(form.competitionDate) ? form.competitionDate : todayString
      const unlockAtISO = competitionDateToMidnightIso(normalizedCompetitionDate)

      const sessionResponse = await fetch('/api/videos/upload-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          prompt: form.prompt || null,
          generationSource: form.generationSource,
          unlockAt: unlockAtISO,
        }),
      })

      const sessionPayload = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionPayload.error || 'Failed to create upload session.')
      }

      setStatus('Uploading video file to MUX…')
      const uploadResponse = await fetch(sessionPayload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Direct upload to MUX failed. Please try again.')
      }

      setStatus('MUX is processing your video…')
      const finalizedVideo = await pollForFinalization(sessionPayload.uploadId)

      setVideos((prev) => (finalizedVideo ? [finalizedVideo, ...prev] : prev))
      setStatus('Video uploaded! It will enter the competition on your chosen date.')
      resetForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditPanel = (video: VideoRow) => {
    setEditingVideo(video)
    setEditForm({
      title: video.title,
      description: video.description,
      prompt: video.prompt ?? '',
      generationSource: video.generation_source,
      competitionDate: isoStringToDateInput(video.unlock_at),
    })
    setLibraryError(null)
    setLibraryStatus(null)
  }

  const handleEditInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const closeEditPanel = () => {
    setEditingVideo(null)
    setIsSavingEdit(false)
    setEditForm({
      title: '',
      description: '',
      prompt: '',
      generationSource: 'human',
      competitionDate: defaultCompetitionDateValue(),
    })
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingVideo) {
      return
    }

    setLibraryError(null)
    setLibraryStatus(null)
    setIsSavingEdit(true)

    try {
      const unlockAtISO = editingCompetitionIsPast
        ? editingVideo.unlock_at
        : competitionDateToMidnightIso(
            editForm.competitionDate && !isDateBeforeToday(editForm.competitionDate) ? editForm.competitionDate : todayString,
          )
      const { data: existingVideoOnDate, error: duplicateCheckError } = await supabase
        .from('videos')
        .select('id')
        .eq('profile_id', editingVideo.profile_id)
        .eq('unlock_at', unlockAtISO)
        .neq('id', editingVideo.id)
        .limit(1)

      if (duplicateCheckError) {
        throw duplicateCheckError
      }

      if (existingVideoOnDate && existingVideoOnDate.length > 0) {
        throw new Error(DUPLICATE_COMPETITION_DAY_ERROR)
      }

      const { data, error: updateError } = await supabase
        .from('videos')
        .update({
          title: editForm.title,
          description: editForm.description,
          prompt: editForm.prompt || null,
          generation_source: editForm.generationSource,
          unlock_at: unlockAtISO,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingVideo.id)
        .select()
        .single()

      if (updateError || !data) {
        throw updateError || new Error('Failed to update video.')
      }

      setVideos((prev) => prev.map((video) => (video.id === data.id ? data : video)))
      setLibraryStatus('Video details updated.')
      closeEditPanel()
    } catch (err) {
      console.error(err)
      setLibraryError(err instanceof Error ? err.message : 'Unable to update video. Try again.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteVideo = async (video: VideoRow) => {
    const confirmed = window.confirm(`Delete "${video.title}"? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    setLibraryError(null)
    setLibraryStatus(null)
    setDeletingVideoId(video.id)

    try {
      const { error: deleteError } = await supabase.from('videos').delete().eq('id', video.id)
      if (deleteError) {
        throw deleteError
      }

      setVideos((prev) => prev.filter((entry) => entry.id !== video.id))
      setLibraryStatus('Video deleted.')

      if (editingVideo && editingVideo.id === video.id) {
        closeEditPanel()
      }
    } catch (err) {
      console.error(err)
      setLibraryError(err instanceof Error ? err.message : 'Unable to delete video. Try again.')
    } finally {
      setDeletingVideoId(null)
    }
  }

  const pollForFinalization = async (uploadId: string) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const finalizeResponse = await fetch('/api/videos/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId }),
      })

      const payload = await finalizeResponse.json()

      if (!finalizeResponse.ok) {
        throw new Error(payload.error || 'Failed to finalize upload.')
      }

      if (payload.status === 'ready' && payload.video) {
        return payload.video as VideoRow
      }

      if (payload.status === 'errored') {
        throw new Error(payload.error || 'MUX reported an error processing the upload.')
      }

      await wait(attempt < 5 ? 3000 : 5000)
    }

    throw new Error('MUX is still processing this upload. Please refresh in a moment.')
  }

  const renderVideoCard = (video: VideoRow) => {
    const unlockDate = new Date(video.unlock_at)
    const now = new Date()
    const isUnlocked = unlockDate <= now
    const playbackUrl = video.mux_playback_id ? `https://stream.mux.com/${video.mux_playback_id}.m3u8` : null

    return (
      <div
        key={video.id}
        className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{video.title}</h3>
            <p className="text-sm text-white/50">Uploaded {new Date(video.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                video.generation_source === 'ai'
                  ? 'border-[#f5d67b]/25 bg-[#f5d67b]/5 text-[#f5d67b]/80'
                  : 'border-white/15 bg-white/5 text-white/60'
              }`}
            >
              {video.generation_source === 'ai' ? 'AI' : 'Human'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditPanel(video)}
                className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-[#f5d67b]/60 hover:text-white"
                aria-label="Edit video"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 20h9" strokeLinecap="round" />
                  <path
                    d="M16.5 3.5a2.121 2.121 0 1 1 3 3L9 17l-4 1 1-4 10.5-10.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVideo(video)}
                disabled={deletingVideoId === video.id}
                className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-red-400/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Delete video"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M3 6h18" strokeLinecap="round" />
                  <path d="M8 6V4h8v2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/70 whitespace-pre-line">{video.description}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Competition day</p>
            <p className="mt-2 text-white">
              {unlockDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.3em] ${isUnlocked ? 'text-white/40' : 'text-[#f5d67b]'}`}>
              {isUnlocked ? 'Competed' : 'Scheduled'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">MUX Asset ID</p>
            <p className="mt-2 text-white break-all">{video.mux_asset_id}</p>
          </div>
        </div>

        {playbackUrl && (
          <div className="mt-4 text-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Playback URL</p>
            <a
              href={playbackUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex break-all text-[#f5d67b] hover:underline"
            >
              {playbackUrl}
            </a>
          </div>
        )}
      </div>
    )
  }

  if (!initialized && loadingVideos) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-white/60">
        Loading your videos...
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-6 top-0 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-[-4rem] left-5 h-80 w-80 rounded-full bg-[#f0b90b]/10 blur-[190px]" />
      </div>

      <div className="mx-auto max-w-5xl space-y-12">
        <div className="relative z-10 rounded-[2.5rem] border border-white/10 bg-black/60 p-10 shadow-[0_30px_140px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">Submit your entry</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Enter the daily competition</h1>
              <p className="text-white/60">
                Upload your video, pick a competition date, and let the community decide if it&apos;s art or slop.
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Profile
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-white/60">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                  maxLength={120}
                  className={fieldClass}
                  placeholder="My incredible launch video"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-white/60">Generation</label>
                <select
                  name="generationSource"
                  value={form.generationSource}
                  onChange={handleInputChange}
                  className={`${fieldClass} text-white`}
                >
                  <option value="human" className="text-black">
                    Human generated
                  </option>
                  <option value="ai" className="text-black">
                    AI generated
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-white/60">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                required
                maxLength={5000}
                rows={4}
                className={`${fieldClass} min-h-[140px]`}
                placeholder="Tell viewers what to expect..."
              />
              <p className="mt-2 text-xs text-white/40">{form.description.length}/5000 characters</p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-white/60">AI Prompt (optional)</label>
              <textarea
                name="prompt"
                value={form.prompt}
                onChange={handleInputChange}
                maxLength={10000}
                rows={4}
                className={`${fieldClass} min-h-[140px]`}
                placeholder="Share the prompts you used to generate this video..."
              />
              <p className="mt-2 text-xs text-white/40">
                {form.prompt.length}/10000 characters — Let others learn from your generation process
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-white/60">Competition date</label>
                <p className="mt-1 text-xs text-white/40">Your video competes against all entries on this day</p>
                <div className="relative" ref={calendarRef}>
                  <button
                    type="button"
                    onClick={() => setShowCalendar((prev) => !prev)}
                    className={`${fieldClass} flex items-center justify-between`}
                    aria-haspopup="dialog"
                    aria-expanded={showCalendar}
                  >
                    <span className={form.competitionDate ? 'text-white' : 'text-white/40'}>
                      {form.competitionDate ? formatDateForDisplay(form.competitionDate) : 'Pick a competition day'}
                    </span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 text-white/60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4M3 11h18" />
                    </svg>
                  </button>

                  {showCalendar && (
                    <div className="absolute left-0 z-30 mt-3 w-full min-w-[260px] rounded-2xl border border-white/15 bg-black/90 p-4 text-white shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <button
                          type="button"
                          onClick={() => changeCalendarMonth(-1)}
                          className="rounded-full border border-white/20 px-2 py-1 text-white/70 transition hover:border-white/50 hover:text-white"
                        >
                          ‹
                        </button>
                        <p className="font-semibold">
                          {new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth)}
                        </p>
                        <button
                          type="button"
                          onClick={() => changeCalendarMonth(1)}
                          className="rounded-full border border-white/20 px-2 py-1 text-white/70 transition hover:border-white/50 hover:text-white"
                        >
                          ›
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                        {WEEKDAY_HEADERS.map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-sm">
                        {Array.from({ length: firstWeekdayIndex }).map((_, idx) => (
                          <div key={`blank-${idx}`} />
                        ))}
                        {Array.from({ length: totalDaysInMonth }).map((_, dayIndex) => {
                          const dayNumber = dayIndex + 1
                          const dateString = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(
                            dayNumber,
                          ).padStart(2, '0')}`
                          const isSelected = form.competitionDate === dateString
                          const isToday = todayString === dateString
                          const isPast = isDateBeforeToday(dateString)

                          return (
                            <button
                              key={dateString}
                              type="button"
                              onClick={() => handleCompetitionDateSelection(dateString)}
                              disabled={isPast}
                              className={`rounded-xl py-2 text-white transition ${
                                isSelected
                                  ? 'bg-[#f5d67b] text-black font-semibold'
                                  : 'bg-white/5 text-white/80 hover:bg-white/15'
                              } ${isToday && !isSelected ? 'ring-1 ring-white/30' : ''} ${
                                isPast ? 'cursor-not-allowed opacity-30 hover:bg-white/5' : ''
                              }`}
                            >
                              {dayNumber}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.4em] text-white/60">Video file</label>
                <div className="mt-3 rounded-2xl border border-white/15 px-4 py-3 text-sm text-white/70">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#f5d67b]/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.3em] file:text-[#f5d67b]"
                    required
                  />
                  <p className="mt-2 text-xs text-white/40">
                    Large files travel directly to MUX through a secure upload URL.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {status && (
              <div className="rounded-2xl border border-[#f5d67b]/30 bg-[#f5d67b]/10 px-4 py-3 text-sm text-[#f5d67b]">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {isSubmitting ? 'Uploading...' : 'Upload video'}
            </button>
          </form>
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-black/50 p-10 shadow-[0_20px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Your entries</h2>
              <p className="text-sm text-white/60">Videos go live on their competition date and are rated by the community.</p>
            </div>
            <button
              onClick={loadVideos}
              disabled={loadingVideos}
              className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingVideos ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {libraryError && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {libraryError}
            </div>
          )}
          {libraryStatus && (
            <div className="mb-4 rounded-2xl border border-[#f5d67b]/30 bg-[#f5d67b]/10 px-4 py-3 text-sm text-[#f5d67b]">
              {libraryStatus}
            </div>
          )}

          {loadingVideos && videos.length === 0 ? (
            <p className="text-sm text-white/60">Loading videos...</p>
          ) : videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/50">
              You haven&apos;t entered any competitions yet. Submit a video above to start competing.
            </div>
          ) : (
            <div className="space-y-6">{videos.map((video) => renderVideoCard(video))}</div>
          )}

          {editingVideo && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">Editing</p>
                  <h3 className="text-xl font-semibold text-white">
                    {editingVideo.title.length > 60 ? `${editingVideo.title.slice(0, 57)}...` : editingVideo.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/40 hover:text-white"
                  onClick={closeEditPanel}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.4em] text-white/60">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditInputChange}
                      required
                      minLength={3}
                      maxLength={120}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.4em] text-white/60">Generation</label>
                    <select
                      name="generationSource"
                      value={editForm.generationSource}
                      onChange={handleEditInputChange}
                      className={`${fieldClass} text-white`}
                    >
                      <option value="human" className="text-black">
                        Human generated
                      </option>
                      <option value="ai" className="text-black">
                        AI generated
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-white/60">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditInputChange}
                    required
                    maxLength={5000}
                    rows={4}
                    className={`${fieldClass} min-h-[140px]`}
                  />
                  <p className="mt-2 text-xs text-white/40">{editForm.description.length}/5000 characters</p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.4em] text-white/60">AI Prompt (optional)</label>
                  <textarea
                    name="prompt"
                    value={editForm.prompt}
                    onChange={handleEditInputChange}
                    maxLength={10000}
                    rows={4}
                    className={`${fieldClass} min-h-[140px]`}
                    placeholder="Share the prompts you used to generate this video..."
                  />
                  <p className="mt-2 text-xs text-white/40">
                    {editForm.prompt.length}/10000 characters — Let others learn from your generation process
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.4em] text-white/60">Competition date</label>
                    <input
                      type="date"
                      name="competitionDate"
                      value={editForm.competitionDate}
                      onChange={handleEditInputChange}
                      disabled={editingCompetitionIsPast}
                      className={`${fieldClass} text-white ${editingCompetitionIsPast ? 'cursor-not-allowed opacity-60' : ''}`}
                      min={todayString}
                    />
                  </div>
                  <div className="flex items-end">
                    {editingCompetitionIsPast ? (
                      <p className="text-xs text-white/50">
                        Competition date is locked for past entries to preserve results.
                      </p>
                    ) : (
                      <p className="text-xs text-white/50">
                        Choose which day&apos;s competition your video enters.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="inline-flex items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingEdit ? 'Updating...' : 'Save video'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/40 hover:text-white"
                    onClick={closeEditPanel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


