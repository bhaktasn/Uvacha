'use client';
import { useState } from 'react';
import Link from 'next/link';
import { addDays, competitionFor, money, type CompetitionConfig } from '@/lib/competition';
export default function CompetitionHome({ config, date, initialVariant, preview, children }: { config: CompetitionConfig; date: string; initialVariant: 'a' | 'b'; preview: boolean; children: React.ReactNode }) {
  const [variant, setVariant] = useState(initialVariant);
  const today = competitionFor(config, date);
  const submit = `/signup?next=%2Fvideos&variant=${variant}`;
  const upcoming = config.weeks.filter(week => week.start > date).slice(0, 2);
  return <div className={`competition-home direction-${variant}`}>
    {preview && <div className="variant-toolbar"><span>Design preview</span><div role="group" aria-label="Homepage direction"><button aria-pressed={variant === 'a'} onClick={() => setVariant('a')}>A · Prize first</button><button aria-pressed={variant === 'b'} onClick={() => setVariant('b')}>B · Creative brief</button></div><Link href="/admin">Edit schedule ↗</Link></div>}
    <div className="prize-ribbon"><span className="live-dot" /><strong>Today’s cash prize: {money(today.prize)}</strong><span>Paid in USDC</span><Link href={submit}>Enter your video ↗</Link></div>
    <div className="competition-container">
      <section className="competition-hero">
        <div className="hero-copy"><p className="eyebrow">{variant === 'a' ? 'Small films. Big imagination.' : 'Your next film starts here.'}</p>
          <h1>{variant === 'a' ? <>Make something<br />worth <em>watching.</em></> : <>A fresh brief.<br />Your <em>strange idea.</em></>}</h1>
          <p className="hero-description">{variant === 'a' ? 'Give your AI video an audience. Enter the daily competition, get community ratings, and compete for a cash prize.' : 'Turn a spark into a short film. Share your take with a community of AI filmmakers and enter the daily competition.'}</p>
          <div className="hero-actions"><Link className="action-primary" href={submit}>{variant === 'a' ? 'Submit your video' : 'Take the challenge'} <span>↗</span></Link><a className="action-secondary" href="#watch">Watch the latest ↓</a></div>
          <p className="hero-note">One video per competition day. Your point of view matters.</p>
        </div>
        <aside className="challenge-card">
          <div className="challenge-top"><span className="eyebrow">{variant === 'a' ? 'Today on Uvacha' : 'The creative brief'}</span><span className="date-chip">{date} · UTC</span></div>
          {variant === 'a' ? <div className="prize-film-frame">
            <div className="frame-viewfinder" aria-hidden="true"><span>UV / DAILY</span><span>REC <i /></span></div>
            <svg className="prize-play-outline" viewBox="0 0 120 140" fill="none" aria-hidden="true"><path d="M20 15L105 70L20 125Z" /></svg>
            <div className="prize-display">{money(today.prize)}<span>cash prize · paid in USDC</span></div>
            <div className="frame-timeline" aria-hidden="true"><span>▶</span><div><i /></div><span>YOUR NEXT FRAME</span></div>
          </div> : <div className="brief-art" aria-hidden="true"><span>MAKE<br />A SCENE.</span><i>REC ●</i></div>}
          <div className="brief-copy"><p className="eyebrow">{today.theme ? 'Themed week' : 'Open theme'}</p><h2>{today.theme?.title ?? 'No brief. No limits to your imagination.'}</h2><p>{today.theme?.brief ?? 'Bring your best AI video: a tiny world, an unexpected story, or a moment we haven’t seen before.'}</p></div>
          <div className="challenge-footer"><span>{today.theme ? `Through ${addDays(today.theme.start, 6)}` : 'A new competition every day'}</span><strong>{variant === 'b' ? `${money(today.prize)} prize` : 'Make it yours ↗'}</strong></div>
        </aside>
      </section>
      <section className="how-it-works" aria-label="How it works">{[['01', 'Make your film', 'Bring your own idea or follow the week’s theme.'], ['02', 'Pick your day', 'Create an account, upload, and choose a competition date.'], ['03', 'Find your audience', 'The community watches and rates your work.']].map(([number, title, description]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</section>
      {upcoming.length > 0 && <section className="upcoming-weeks"><p className="eyebrow">Coming to the creative calendar</p>{upcoming.map(week => <article key={week.id}><span>{week.start} — {addDays(week.start, 6)}</span><h3>{week.title}</h3><p>{week.brief}</p></article>)}</section>}
      <section id="watch" className="watch-section"><div className="section-heading"><div><p className="eyebrow">Made by the community</p><h2>The latest on screen.</h2></div><Link href={submit}>Put your film here ↗</Link></div>{children}</section>
      <section className="closing-invite"><p className="eyebrow">The next one could be yours</p><h2>Your film deserves an audience.</h2><Link className="action-primary" href={submit}>Enter a competition ↗</Link><Link className="action-secondary" href="/about">More about Uvacha</Link></section>
    </div>
  </div>;
}
