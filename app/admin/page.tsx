import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import LocalAdmin from '@/components/LocalAdmin';
import { getCompetitionConfig } from '@/lib/competition-server';
export default async function AdminPage() {
  const host = (await headers()).get('host') ?? '';
  if (process.env.NODE_ENV !== 'development' || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) notFound();
  return <LocalAdmin initial={await getCompetitionConfig()} />;
}
