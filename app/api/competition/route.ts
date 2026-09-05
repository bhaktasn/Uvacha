import { getCompetitionConfig } from '@/lib/competition-server';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json(await getCompetitionConfig()); }
