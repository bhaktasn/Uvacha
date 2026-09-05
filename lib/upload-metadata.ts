import { createHmac, timingSafeEqual } from 'node:crypto';

export type UploadMetadata = { profileId: string; title: string; description: string; prompt: string | null; unlockAt: string };
type UploadTicket = { uploadId: string; metadata: UploadMetadata; expires: number };

export function validateUploadMetadata(value: unknown): UploadMetadata {
  const input = value as UploadMetadata;
  if (!input || typeof input.profileId !== 'string' || !input.profileId || typeof input.title !== 'string' || input.title.trim().length < 3 || input.title.length > 120 || typeof input.description !== 'string' || !input.description.trim() || input.description.length > 5000 || (input.prompt !== null && (typeof input.prompt !== 'string' || input.prompt.length > 10000)) || typeof input.unlockAt !== 'string' || !Number.isFinite(Date.parse(input.unlockAt))) throw new Error('Please check your title, description, prompt, and competition date.');
  return { profileId: input.profileId, title: input.title.trim(), description: input.description.trim(), prompt: input.prompt, unlockAt: new Date(input.unlockAt).toISOString() };
}
function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(`uvacha-upload-v1:${payload}`).digest();
}
export function createUploadTicket(uploadId: string, metadata: UploadMetadata, secret: string) {
  const payload = Buffer.from(JSON.stringify({ uploadId, metadata: validateUploadMetadata(metadata), expires: Date.now() + 7 * 86400000 } satisfies UploadTicket)).toString('base64url');
  return `${payload}.${sign(payload, secret).toString('base64url')}`;
}
export function readUploadTicket(token: string, uploadId: string, profileId: string, secret: string): UploadMetadata {
  if (token.length > 150000) throw new Error('Invalid upload receipt.');
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new Error('Invalid upload receipt.');
  const expected = sign(payload, secret);
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error('Invalid upload receipt.');
  const ticket: UploadTicket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (typeof ticket.expires !== 'number' || ticket.expires < Date.now() || ticket.uploadId !== uploadId || ticket.metadata.profileId !== profileId) throw new Error('This upload receipt has expired or belongs to another upload.');
  return validateUploadMetadata(ticket.metadata);
}
