import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as receipts from '../lib/upload-metadata.ts';

// Execute the real route handlers against fake providers. No accounts, assets,
// emails, or database rows are created outside this process.
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com' };
let assetStatus = 'ready';
let saved = null;
let muxPayload;
const supabase = {
  auth: { getUser: async () => ({ data: { user }, error: null }) },
  from(table) {
    let inserted;
    const query = {
      select() { return query; }, eq() { return query; },
      limit: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: saved, error: null }),
      upsert: async () => ({ error: null }),
      insert(value) { assert.equal(table, 'videos'); inserted = value; return query; },
      single: async () => { saved = { id: 'video-test', ...inserted }; return { data: saved, error: null }; },
    };
    return query;
  },
};
const mux = {
  uploads: {
    create: async value => { muxPayload = value; assert.ok(value.new_asset_settings.passthrough.length <= 255); return { id: 'upload-test', url: 'https://upload.invalid/test' }; },
    retrieve: async () => ({ status: 'asset_created', asset_id: 'asset-test', new_asset_settings: muxPayload.new_asset_settings }),
  },
  assets: { retrieve: async () => ({ id: 'asset-test', status: assetStatus, playback_ids: [{ policy: 'public', id: 'playback-test' }] }) },
};
function handler(path) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, process: { env: { MUX_TOKEN_SECRET: 'test-secret' } }, console,
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name === '@/lib/mux/client') return { getMuxVideoClient: () => mux };
      if (name === '@/lib/supabase/server') return { createClient: async () => supabase };
      if (name === '@/lib/upload-metadata') return receipts;
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return exports.POST;
}
const create = handler('app/api/videos/upload-session/route.ts');
const finalize = handler('app/api/videos/finalize/route.ts');
const request = body => new Request('http://localhost:3000/api/videos/test', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify(body) });
const metadata = { title: 'A house in the woods', description: 'D'.repeat(5000), prompt: 'P'.repeat(10000), unlockAt: '2026-10-28T00:00:00.000Z' };
const session = await create(request(metadata));
assert.equal(session.status, 200);
const { uploadId, uploadTicket } = await session.json();
assert.ok(muxPayload.new_asset_settings.passthrough.length < 100);
assert.equal(muxPayload.cors_origin, 'http://localhost:3000');
assetStatus = 'preparing';
assert.equal((await (await finalize(request({ uploadId, uploadTicket }))).json()).status, 'preparing');
assetStatus = 'ready';
const done = await finalize(request({ uploadId, uploadTicket }));
assert.equal(done.status, 200);
assert.equal(saved.description, metadata.description);
assert.equal(saved.prompt, metadata.prompt);
assert.equal('generation_source' in saved, false);
assert.equal((await (await finalize(request({ uploadId, uploadTicket }))).json()).video.id, saved.id);
assert.equal((await finalize(request({ uploadId, uploadTicket: `${uploadTicket}x` }))).status, 400);
assert.equal((await finalize(request({ uploadId: 'other-upload', uploadTicket }))).status, 400);
assert.throws(() => receipts.readUploadTicket(uploadTicket, uploadId, 'another-user', 'test-secret'));
const expiredNow = Date.now;
try { Date.now = () => expiredNow() + 8 * 86400000; assert.throws(() => receipts.readUploadTicket(uploadTicket, uploadId, user.id, 'test-secret')); } finally { Date.now = expiredNow; }
assetStatus = 'errored';
assert.equal((await finalize(request({ uploadId, uploadTicket }))).status, 400);
// Existing short-metadata uploads can still finish after this deployment.
saved = null; assetStatus = 'ready';
muxPayload.new_asset_settings.passthrough = JSON.stringify({ ...metadata, profileId: user.id, description: 'Legacy description', prompt: null });
assert.equal((await finalize(request({ uploadId }))).status, 200);
console.log('Passed: full-length text, compact provider metadata, signed owner-bound receipts, pending and failed processing, retry/idempotency, tampering/expiry, legacy uploads, no generation classification writes.');
