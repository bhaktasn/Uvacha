import Link from 'next/link'

export default function AboutPage() {
  const ratingScale = [
    { score: 0, label: 'Pure Slop', emoji: '💩' },
    { score: 1, label: 'Needs Vision', emoji: '💩' },
    { score: 2, label: 'Interesting Start', emoji: '💩' },
    { score: 3, label: 'Getting There', emoji: '🤌' },
    { score: 4, label: 'Nearly Art', emoji: '🤌' },
    { score: 5, label: 'Certified Art', emoji: '🤌' },
  ]

  return (
    <div className="relative isolate min-h-screen bg-[#040404] text-white">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-x-0 top-0 mx-auto h-72 w-[80%] rounded-[50%] bg-[#f5d67b]/15 blur-[220px]" />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-64 w-[70%] rounded-[50%] bg-[#f5d67b]/8 blur-[200px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-20 space-y-16">
        <section className="text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-[#f5d67b]">About</p>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-white">
            Uvacha is where AI video battles grow from 💩 slop to 🤌 art.
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Every day, creators drop their boldest AI or human-made videos into the arena.
            Viewers rate each entry from <span className="font-semibold">0 (💩)</span> to{' '}
            <span className="font-semibold">5 (🤌)</span>, pushing AI video generation to be a real creative
            medium—not just algorithmic noise. Daily rewards crown the clips that bend technology into art.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_20px_45px_rgba(245,214,123,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffe8a0]"
            >
              Join the Daily Battle
            </Link>
            <Link
              href="/videos"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Watch the Leaderboard
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl space-y-6">
          <h2 className="text-2xl font-semibold text-white">How the competition works</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-xl font-semibold mb-2 text-white">Daily drops, daily rewards</h3>
              <p className="text-sm text-white/70">
                Upload once per day, strategize your release window, and climb to the top as the community drips
                rewards to the most artful videos.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-xl font-semibold mb-2 text-white">AI vs Human fairness</h3>
              <p className="text-sm text-white/70">
                Whether you prompt with diffusion models or shoot on a camera, every piece battles together for the
                same cultural podium.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-xl font-semibold mb-2 text-white">Community as curator</h3>
              <p className="text-sm text-white/70">
                Ratings come straight from the audience—no opaque judges—so the crowd decides what rises beyond slop.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-xl font-semibold mb-2 text-white">Artistic evolution</h3>
              <p className="text-sm text-white/70">
                Feedback loops and receipts for every vote help creators iterate toward true cinematic AI expression.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">The rating scale</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {ratingScale.map((step) => (
              <div
                key={step.score}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center shadow-[0_15px_45px_rgba(0,0,0,0.35)]"
              >
                <div className="mb-2 text-3xl">{step.emoji}</div>
                <div className="text-3xl font-bold text-[#f5d67b]">{step.score}</div>
                <p className="text-xs text-white/70">{step.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/70">
            The more 🤌 you rack up, the closer you are to the daily purse and long-term bragging rights.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Why we built Uvacha</h2>
          <p className="text-white/70">
            AI video tools make it effortless to publish something—maybe too effortless. Uvacha exists to filter out the
            noise, spotlight the inventors, and reward the artists who treat AI like a brush rather than a button. By
            putting human taste in charge through transparent scoring, we turn experimentation into a sport and prove
            that the future of video can be both synthetic and soulful.
          </p>
        </section>
      </div>
    </div>
  )
}

