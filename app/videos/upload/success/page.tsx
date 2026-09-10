import Link from 'next/link'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

const formatCompetitionDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export default async function UploadSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const videoId = firstValue(params.videoId)
  const isProcessing = firstValue(params.processing) === '1'
  const competitionDate = formatCompetitionDate(firstValue(params.date))

  return (
    <main className="upload-outcome-page upload-outcome-success">
      <div className="upload-outcome-glow" aria-hidden="true" />
      <section className="upload-outcome-card" aria-labelledby="upload-outcome-title">
        <div className="upload-outcome-mark" aria-hidden="true">
          {isProcessing ? <span className="upload-outcome-spinner" /> : <svg viewBox="0 0 48 48" fill="none"><path d="m14 25 7 7 14-17" /></svg>}
        </div>
        <p className="eyebrow">{isProcessing ? 'Upload received' : 'Submission confirmed'}</p>
        <h1 id="upload-outcome-title">{isProcessing ? 'Your film is safely with us.' : 'Your film is in.'}</h1>
        <p className="upload-outcome-copy">
          {isProcessing
            ? 'The file transfer finished successfully. We’re still preparing it for playback, so there’s no need to upload it again.'
            : 'Your video is ready and has been added to your creator entries.'}
        </p>

        <div className="upload-outcome-detail">
          <span>{isProcessing ? 'Current status' : 'Competition day'}</span>
          <strong>{isProcessing ? 'Preparing for playback' : competitionDate ?? 'Scheduled'}</strong>
          {isProcessing && <small>You can leave this page now and check its status from your creator console.</small>}
        </div>

        <div className="upload-outcome-actions">
          {videoId && <Link href={`/videos/${videoId}`} className="action-primary">View your video <span aria-hidden="true">↗</span></Link>}
          <Link href="/videos" className={videoId ? 'upload-outcome-secondary' : 'action-primary'}>
            {isProcessing ? 'Go to creator console' : videoId ? 'Back to creator console' : 'See your entries'}
          </Link>
        </div>
      </section>
    </main>
  )
}
