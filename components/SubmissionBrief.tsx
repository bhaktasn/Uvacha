'use client';
import { useEffect, useState } from 'react';
import { addDays, competitionFor, money, type CompetitionConfig } from '@/lib/competition';
export default function SubmissionBrief({ date, schedule }: { date: string; schedule?: CompetitionConfig }) {
  const [loadedConfig, setConfig] = useState<CompetitionConfig | null>(null);
  const config = schedule ?? loadedConfig;
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (schedule) return;
    const controller = new AbortController();
    fetch('/api/competition', { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Schedule unavailable'); return response.json(); })
      .then(setConfig)
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt, schedule]);
  if (!date) return <aside className="submission-brief">Choose a competition date to see its theme and cash prize.</aside>;
  if (failed) return <aside className="submission-brief" role="alert"><h2>We couldn’t load this day’s brief.</h2><p>Check the theme before submitting your entry.</p><button type="button" className="text-button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Retry loading the brief ↻</button></aside>;
  if (!config) return <aside className="submission-brief" role="status">Loading the theme and prize for your entry…</aside>;
  const day = competitionFor(config, date);
  return <aside className={`submission-brief ${day.theme ? 'has-theme' : ''}`} aria-live="polite" aria-atomic="true">
    <div className="submission-brief-header"><span className="eyebrow">{day.theme ? 'Themed competition · your entry’s brief' : 'Open competition · your entry'}</span><strong>{money(day.prize)} cash prize</strong></div>
    <p className="entry-date">Selected competition date: <strong>{date} (UTC)</strong></p>
    <h2>{day.theme?.title ?? 'Open theme — your idea, your film.'}</h2>
    <p className="entry-theme-text">{day.theme?.brief ?? 'There is no scheduled theme for this date. Submit your best AI video on any subject.'}</p>
    {day.theme && <div className="theme-guidance"><p>Make your submission around this brief.</p><p>Themed week: {day.theme.start} through {addDays(day.theme.start, 6)} (UTC). Choose a different competition date to enter a different brief.</p></div>}
    <p>Prize paid in USDC. One entry per competition day.</p>
  </aside>;
}
