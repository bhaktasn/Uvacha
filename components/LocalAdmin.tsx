'use client';
import { useState } from 'react';
import Link from 'next/link';
import SubmissionBrief from '@/components/SubmissionBrief';
import { addDays, competitionFor, competitionToday, money, type CompetitionConfig } from '@/lib/competition';
export default function LocalAdmin({ initial }: { initial: CompetitionConfig }) {
  const [config, setConfig] = useState(initial);
  const [date, setDate] = useState(competitionToday());
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const update = (next: CompetitionConfig) => { setConfig(next); setDirty(true); setMessage(''); };
  const day = competitionFor(config, date);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/local-admin', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save');
      setConfig(result); setDirty(false); setMessage('Saved locally. Refresh the homepage to see your changes. Deploy the updated schedule to publish them.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setSaving(false); }
  }
  return <div className="admin-container"><p className="eyebrow">Local studio · scheduling</p><h1>Set the stage.</h1><p>Plan themed weeks and daily prizes. Dates use UTC. Changes are saved to <code>data/competition.json</code> and go live with your next deployment.</p><Link className="action-secondary" href="/?preview=1">Compare homepage designs ↗</Link>
    <form onSubmit={save}><fieldset disabled={saving}>
      <section className="admin-panel"><h2>Daily cash prizes</h2><div className="admin-fields"><label>Default prize ($)<input type="number" min="0" max="100000" step="0.01" required value={config.defaultPrize} onChange={event => update({ ...config, defaultPrize: Number(event.target.value) })} /></label><label>Competition date<input type="date" required value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label><label>Prize for this date ($)<input type="number" min="0" max="100000" step="0.01" required value={day.prize} onChange={event => update({ ...config, prizes: { ...config.prizes, [date]: Number(event.target.value) } })} /></label></div><button type="button" className="text-button" onClick={() => { const prizes = { ...config.prizes }; delete prizes[date]; update({ ...config, prizes }); }}>Use default for selected date</button>
      {Object.keys(config.prizes).length > 0 && <div className="prize-overrides">{Object.entries(config.prizes).sort().map(([day, prize]) => <button type="button" key={day} onClick={() => setDate(day)}>{day} · {money(prize)}</button>)}</div>}</section>
      <section className="admin-panel"><div className="section-heading"><div><h2>Themed weeks</h2><p>Each brief runs for seven days, including its start date.</p></div><button type="button" className="action-secondary" onClick={() => update({ ...config, weeks: [...config.weeks, { id: crypto.randomUUID(), start: date, title: '', brief: '' }] })}>+ Add week</button></div>
        {config.weeks.length === 0 && <p>No themed weeks scheduled. Open theme is shown by default.</p>}
        {config.weeks.map((week, index) => <div className="week-editor" key={week.id}><div className="admin-fields"><label>Starts (UTC)<input type="date" required value={week.start} onChange={event => update({ ...config, weeks: config.weeks.map((item, i) => i === index ? { ...item, start: event.target.value } : item) })} /></label><label>Theme title<input required maxLength={100} placeholder="The house is not empty" value={week.title} onChange={event => update({ ...config, weeks: config.weeks.map((item, i) => i === index ? { ...item, title: event.target.value } : item) })} /></label></div><label>Creative brief<textarea required maxLength={1500} rows={3} placeholder="Make a horror short set in a haunted house. Let the house itself become a character." value={week.brief} onChange={event => update({ ...config, weeks: config.weeks.map((item, i) => i === index ? { ...item, brief: event.target.value } : item) })} /></label><div className="section-heading"><span>{week.start ? `Runs through ${addDays(week.start, 6)}` : 'Choose a start date'}</span><button type="button" className="text-button" onClick={() => update({ ...config, weeks: config.weeks.filter(item => item.id !== week.id) })}>Remove week</button></div></div>)}
      </section><section className="schedule-preview"><p className="eyebrow">What the uploader will see</p><SubmissionBrief date={date} schedule={config} /></section>
      <div className="admin-save"><button className="action-primary" type="submit">{saving ? 'Saving…' : 'Save schedule'}</button><span>{dirty ? 'Unsaved changes' : 'Schedule up to date'}</span></div><p role="status">{message}</p>
    </fieldset></form>
  </div>;
}
