'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'
import SubmissionBrief from '@/components/SubmissionBrief'
import { competitionToday } from '@/lib/competition'

type VideoRow = Database['public']['Tables']['videos']['Row']
type PendingUpload = { uploadId: string; uploadTicket: string }
type UploadStage = 'creating' | 'uploading' | 'processing'

const UPLOAD_STEPS: { id: UploadStage; label: string }[] = [
  { id: 'creating', label: 'Getting ready' },
  { id: 'uploading', label: 'Uploading file' },
  { id: 'processing', label: 'Preparing film' },
]

const defaultCompetitionDateValue = () => {
  return competitionToday()
}

const competitionDateToMidnightIso = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number)

  if (!year || !month || !day) {
    return new Date().toISOString()
  }

  const midnightLocal = new Date(Date.UTC(year, month - 1, day))
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

  return value < competitionToday()
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DUPLICATE_COMPETITION_DAY_ERROR = 'You already have a video competing on this date. Choose a different competition day.'
const UPLOAD_DRAFT_KEY = 'uvacha-upload-form-draft'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const uploadFile = (url: string, file: File, onProgress: (percentage: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    })
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error('The video transfer failed. Check your connection and try again.'))
      }
    })
    request.addEventListener('error', () => reject(new TypeError('Network request failed')))
    request.addEventListener('abort', () => reject(new Error('The upload was cancelled.')))
    request.send(file)
  })

function UploadProgress({ stage, transferProgress, processingAttempt, fileName }: {
  stage: UploadStage
  transferProgress: number
  processingAttempt: number
  fileName: string
}) {
  const currentStep = UPLOAD_STEPS.findIndex((step) => step.id === stage)
  const overallProgress = stage === 'creating'
    ? 5
    : stage === 'uploading'
      ? 10 + Math.round(transferProgress * 0.75)
      : Math.min(98, 90 + Math.floor(processingAttempt / 3))
  const stageCopy = stage === 'creating'
    ? 'Opening a secure connection…'
    : stage === 'uploading'
      ? `${transferProgress}% of your file transferred`
      : 'Your upload is complete. We’re preparing it for playback…'

  return (
    <section className="upload-progress-panel" aria-labelledby="upload-progress-title" aria-busy="true">
      <div className="upload-progress-orbit" aria-hidden="true"><span /></div>
      <p className="eyebrow">Submission in progress</p>
      <h2 id="upload-progress-title">Keep this tab open.</h2>
      <p className="upload-progress-file">{fileName}</p>

      <div className="upload-progress-track" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallProgress}>
        <span style={{ width: `${overallProgress}%` }} />
      </div>
      <div className="upload-progress-readout" role="status" aria-live="polite">
        <span>{stageCopy}</span><strong>{overallProgress}%</strong>
      </div>

      <ol className="upload-progress-steps" aria-label="Upload stages">
        {UPLOAD_STEPS.map((step, index) => {
          const state = index < currentStep ? 'complete' : index === currentStep ? 'active' : 'waiting'
          return <li key={step.id} data-state={state}><span>{state === 'complete' ? '✓' : index + 1}</span>{step.label}</li>
        })}
      </ol>
      <p className="upload-progress-note">Large files and playback preparation can take a few minutes. You’ll be taken to a confirmation screen when it’s done.</p>
    </section>
  )
}

const isoStringToDateInput = (isoString: string) => {
  if (!isoString) {
    return defaultCompetitionDateValue()
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return defaultCompetitionDateValue()
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
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
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null)
  const [transferProgress, setTransferProgress] = useState(0)
  const [processingAttempt, setProcessingAttempt] = useState(0)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const recoveryKey = useRef<string | null>(null)
  const rememberUpload = (pending: PendingUpload | null) => {
    setPendingUpload(pending)
    try {
      if (recoveryKey.current) {
        if (pending) localStorage.setItem(recoveryKey.current, JSON.stringify(pending))
        else localStorage.removeItem(recoveryKey.current)
      }
    } catch { /* Recovery still works in this tab when storage is unavailable. */ }
  }
  const [editingVideo, setEditingVideo] = useState<VideoRow | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    prompt: '',
    competitionDate: defaultCompetitionDateValue(),
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    prompt: '',
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setVideos([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('profile_id', user.id)
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

      recoveryKey.current = `uvacha-pending-upload:${user.id}`
      try {
        const saved = JSON.parse(localStorage.getItem(recoveryKey.current) ?? 'null')
        if (typeof saved?.uploadId === 'string' && typeof saved?.uploadTicket === 'string') setPendingUpload(saved)
      } catch { /* Ignore unavailable storage or an invalid old receipt. */ }
      try {
        const draft = JSON.parse(sessionStorage.getItem(UPLOAD_DRAFT_KEY) ?? 'null')
        if (draft && typeof draft.title === 'string' && typeof draft.description === 'string' && typeof draft.prompt === 'string' && typeof draft.competitionDate === 'string') {
          setForm(draft)
        }
      } catch { /* The retry still works when session storage is unavailable. */ }
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
    if (!isSubmitting) return undefined
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isSubmitting])

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
    setUploadStage('creating')
    setTransferProgress(0)
    setProcessingAttempt(0)
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
          unlockAt: unlockAtISO,
        }),
      })

      const sessionPayload = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionPayload.error || 'Failed to create upload session.')
      }

      setUploadStage('uploading')
      await uploadFile(sessionPayload.uploadUrl, file, setTransferProgress)

      setStatus('Preparing your video for playback…')
      setUploadStage('processing')
      const pending = { uploadId: sessionPayload.uploadId, uploadTicket: sessionPayload.uploadTicket }
      rememberUpload(pending)
      const finalizedVideo = await pollForFinalization(pending.uploadId, pending.uploadTicket, setProcessingAttempt)

      if (!finalizedVideo) {
        router.push('/videos/upload/success?processing=1')
        return
      }
      rememberUpload(null)

      setVideos((prev) => (finalizedVideo ? [finalizedVideo, ...prev] : prev))
      resetForm()
      try { sessionStorage.removeItem(UPLOAD_DRAFT_KEY) } catch { /* Nothing to clean up. */ }
      router.push(`/videos/upload/success?videoId=${encodeURIComponent(finalizedVideo.id)}&date=${encodeURIComponent(normalizedCompetitionDate)}`)
    } catch (err) {
      console.error(err)
      setStatus(null)
      const message = err instanceof TypeError ? 'Could not connect to the upload service. Check your connection and try again.' : err instanceof Error ? err.message : 'Upload failed. Please try again.'
      try { sessionStorage.setItem(UPLOAD_DRAFT_KEY, JSON.stringify(form)) } catch { /* Continue to the error screen. */ }
      router.push(`/videos/upload/error?message=${encodeURIComponent(message)}`)
    } finally {
      setIsSubmitting(false)
      setUploadStage(null)
    }
  }

  const resumeUpload = async () => {
    if (!pendingUpload) return
    setIsSubmitting(true)
    setError(null)
    setStatus('Checking your uploaded video…')
    try {
      const video = await pollForFinalization(pendingUpload.uploadId, pendingUpload.uploadTicket)
      if (!video) { setStatus('Your video is still processing. Check again shortly.'); return }
      setVideos(previous => [video, ...previous.filter(item => item.id !== video.id)])
      rememberUpload(null)
      resetForm()
      setStatus('Your video is ready and entered for its competition date.')
    } catch (error) {
      setStatus(null)
      const message = error instanceof Error ? error.message : 'Could not check your upload. Please try again.'
      router.push(`/videos/upload/error?message=${encodeURIComponent(message)}`)
    } finally { setIsSubmitting(false) }
  }

  const openEditPanel = (video: VideoRow) => {
    setEditingVideo(video)
    setEditForm({
      title: video.title,
      description: video.description,
      prompt: video.prompt ?? '',
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

  const pollForFinalization = async (uploadId: string, uploadTicket: string, onAttempt?: (attempt: number) => void) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      onAttempt?.(attempt + 1)
      const finalizeResponse = await fetch('/api/videos/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId, uploadTicket }),
      })

      const payload = await finalizeResponse.json()

      if (!finalizeResponse.ok) {
        throw new Error(payload.error || 'Failed to finalize upload.')
      }

      if (payload.status === 'ready' && payload.video) {
        return payload.video as VideoRow
      }

      if (payload.status === 'errored') {
        throw new Error(payload.error || 'We couldn’t process this video. Try exporting it as an MP4 and uploading again.')
      }

      await wait(attempt < 5 ? 3000 : 5000)
    }

    return null
  }

  const renderVideoCard = (video: VideoRow) => {
    const unlockDate = new Date(video.unlock_at)
    const now = new Date()
    const isUnlocked = unlockDate <= now

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
              {unlockDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} (UTC)
            </p>
            <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.3em] ${isUnlocked ? 'text-white/40' : 'text-[#f5d67b]'}`}>
              {isUnlocked ? 'Competed' : 'Scheduled'}
            </p>
          </div>
        </div>
        {video.mux_playback_id && <Link href={`/videos/${video.id}`} className="action-secondary">Watch your video ↗</Link>}
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
    <div className="creator-workspace relative isolate min-h-[calc(100vh-5rem)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-6 top-0 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-[-4rem] left-5 h-80 w-80 rounded-full bg-[#f0b90b]/10 blur-[190px]" />
      </div>

      <div className="mx-auto max-w-5xl space-y-12">
        <div className="relative z-10 rounded-[2.5rem] border border-white/10 bg-black/60 p-10 shadow-[0_30px_140px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">Submit your entry</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Your next film starts here.</h1>
              <p className="text-white/60">
                Upload your video, pick a competition date, and share your work with the community.
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Profile
            </button>
          </div>

          {isSubmitting && uploadStage ? (
            <UploadProgress stage={uploadStage} transferProgress={transferProgress} processingAttempt={processingAttempt} fileName={file?.name ?? 'Your video'} />
          ) : <form onSubmit={handleUpload} className="space-y-8">
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
                    Choose your finished video. Keep this tab open while it uploads.
                  </p>
                </div>
              </div>
            </div>

            <SubmissionBrief date={form.competitionDate} />

            {error && (
              <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {status && (
              <div role="status" className="rounded-2xl border border-[#f5d67b]/30 bg-[#f5d67b]/10 px-4 py-3 text-sm text-[#f5d67b]">
                {status}
              </div>
            )}

            {pendingUpload && <div className="upload-recovery"><h3>Your file has been uploaded.</h3><p>Finish processing and save your entry. You don’t need to select the file again.</p><button type="button" className="action-primary" disabled={isSubmitting} onClick={resumeUpload}>Check upload status</button><button type="button" className="action-secondary" disabled={isSubmitting} onClick={() => { if (window.confirm('Start over? This will discard the saved recovery receipt for this upload.')) { rememberUpload(null); setStatus(null); setError(null) } }}>Start over</button></div>}

            <button
              type="submit"
              disabled={isSubmitting || !!pendingUpload}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.45em] text-black transition hover:-translate-y-0.5 hover:bg-[#ffe8a0] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {isSubmitting ? 'Uploading...' : 'Upload video'}
            </button>
          </form>}
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

                <SubmissionBrief date={editForm.competitionDate} />

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
