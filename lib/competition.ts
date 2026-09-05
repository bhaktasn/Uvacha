export type ThemeWeek = { id: string; start: string; title: string; brief: string };
export type CompetitionConfig = { defaultPrize: number; prizes: Record<string, number>; weeks: ThemeWeek[] };
export const competitionToday = () => new Date().toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
export const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
export function competitionFor(config: CompetitionConfig, date: string) {
  return { date, prize: config.prizes[date] ?? config.defaultPrize, theme: config.weeks.find(week => date >= week.start && date <= addDays(week.start, 6)) ?? null };
}
export function validateCompetition(value: unknown): CompetitionConfig {
  const config = value as CompetitionConfig;
  const validDate = (date: string) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  const validPrize = (prize: number) => typeof prize === 'number' && Number.isFinite(prize) && prize >= 0 && prize <= 100000 && Math.abs(prize * 100 - Math.round(prize * 100)) < 0.00001;
  if (!config || !validPrize(config.defaultPrize) || !config.prizes || typeof config.prizes !== 'object' || Array.isArray(config.prizes) || !Array.isArray(config.weeks)) throw new Error('Enter a valid default prize and schedule.');
  if (Object.entries(config.prizes).some(([date, prize]) => !validDate(date) || !validPrize(prize))) throw new Error('Prizes need a valid date and amount from $0 to $100,000, with at most two decimal places.');
  config.weeks.forEach(week => {
    if (!week || typeof week.id !== 'string' || !week.id || !validDate(week.start) || typeof week.title !== 'string' || !week.title.trim() || week.title.length > 100 || typeof week.brief !== 'string' || !week.brief.trim() || week.brief.length > 1500) throw new Error('Each week needs a start date, title (up to 100 characters), and brief (up to 1,500 characters).');
  });
  const weeks = [...config.weeks].sort((a, b) => a.start.localeCompare(b.start));
  weeks.forEach((week, i) => {
    if (i && week.start <= addDays(weeks[i - 1].start, 6)) throw new Error('Themed weeks cannot overlap. Each runs for seven days.');
    if (weeks.findIndex(other => other.id === week.id) !== i) throw new Error('Week IDs must be unique.');
  });
  return { defaultPrize: config.defaultPrize, prizes: config.prizes, weeks };
}
