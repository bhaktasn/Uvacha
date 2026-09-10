import Link from 'next/link'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function UploadErrorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const suppliedMessage = firstValue(params.message)?.trim()
  const message = suppliedMessage?.slice(0, 400) || 'Something interrupted the upload. Your entry was not submitted.'

  return (
    <main className="upload-outcome-page upload-outcome-error">
      <div className="upload-outcome-glow" aria-hidden="true" />
      <section className="upload-outcome-card" aria-labelledby="upload-outcome-title">
        <div className="upload-outcome-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none"><path d="M24 14v13M24 34h.01" /></svg>
        </div>
        <p className="eyebrow">Upload interrupted</p>
        <h1 id="upload-outcome-title">Your film wasn’t submitted.</h1>
        <p className="upload-outcome-copy">Return to the creator console for the safest next step. If the transfer didn’t finish, your typed submission details will still be waiting there.</p>

        <div className="upload-outcome-detail" role="alert">
          <span>What happened</span>
          <strong>{message}</strong>
          <small>If your connection dropped, make sure it’s stable before retrying and keep the tab open until confirmation.</small>
        </div>

        <div className="upload-outcome-actions">
          <Link href="/videos" className="action-primary">Return and try again</Link>
          <Link href="/" className="upload-outcome-secondary">Back to home</Link>
        </div>
      </section>
    </main>
  )
}
