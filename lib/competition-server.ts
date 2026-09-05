import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import bundledConfig from '@/data/competition.json';
import { validateCompetition, type CompetitionConfig } from './competition';
export const schedulePath = join(process.cwd(), 'data', 'competition.json');
export async function getCompetitionConfig(): Promise<CompetitionConfig> {
  return validateCompetition(process.env.NODE_ENV === 'development' ? JSON.parse(await readFile(schedulePath, 'utf8')) : bundledConfig);
}
