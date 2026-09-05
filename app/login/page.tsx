import AuthForm from '@/components/AuthForm';
import { getCompetitionConfig } from '@/lib/competition-server';
import { competitionFor, competitionToday } from '@/lib/competition';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; variant?: string; error?: string }> }) {
  const [params, config] = await Promise.all([searchParams, getCompetitionConfig()]);
  return <AuthForm mode="login" next={params.next} variant={params.variant} callbackError={params.error} prize={competitionFor(config, competitionToday()).prize} />;
}
