import { writeFile, rename } from 'node:fs/promises';
import { getCompetitionConfig, schedulePath } from '@/lib/competition-server';
import { validateCompetition } from '@/lib/competition';
function allowed(request: Request) {
  // Next's development server may normalize request.url to localhost even
  // when the browser is using 127.0.0.1. Validate the actual Host header.
  const host = request.headers.get('host') ?? '';
  return process.env.NODE_ENV === 'development' && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}
export async function GET(request: Request) {
  if (!allowed(request)) return new Response('Not found', { status: 404 });
  return Response.json(await getCompetitionConfig());
}
export async function PUT(request: Request) {
  if (!allowed(request)) return new Response('Not found', { status: 404 });
  const expectedOrigin = `${new URL(request.url).protocol}//${request.headers.get('host')}`;
  if (request.headers.get('origin') !== expectedOrigin || !request.headers.get('content-type')?.startsWith('application/json')) return new Response('Forbidden', { status: 403 });
  try {
    const body = await request.text();
    if (body.length > 100000) return new Response('Schedule too large', { status: 413 });
    const config = validateCompetition(JSON.parse(body));
    const temporaryPath = `${schedulePath}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(config, null, 2) + '\n');
    await rename(temporaryPath, schedulePath);
    return Response.json(config);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not save schedule' }, { status: 400 });
  }
}
