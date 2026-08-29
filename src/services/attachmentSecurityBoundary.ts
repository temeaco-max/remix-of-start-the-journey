/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';

export type AttachmentSecurityState = 'accepted' | 'rejected' | 'pending_scan';

export interface AttachmentSecurityResult {
  state: AttachmentSecurityState;
  sha256: string;
  bytes: number;
  mimeType: string;
  reason?: string;
  scanner: 'builtin' | 'clamav' | 'none';
}

const MAX_BYTES = Math.max(1_024, Math.min(50 * 1024 * 1024, Number(process.env.KURUKOO_ARTIFACT_MAX_BYTES || 25 * 1024 * 1024)));

function normalizeMime(value: unknown): string {
  const mime = String(value || 'application/octet-stream').trim().toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mime) ? mime.slice(0, 120) : 'application/octet-stream';
}

function magicMatches(mime: string, bytes: Buffer): boolean {
  if (bytes.length < 4) return false;
  if (mime === 'application/pdf') return bytes.subarray(0, 4).toString('ascii') === '%PDF';
  if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/gif') return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (mime === 'audio/mpeg') return bytes.subarray(0, 3).toString('ascii') === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (mime === 'audio/wav') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE';
  if (mime === 'video/mp4') return bytes.subarray(4, 8).toString('ascii') === 'ftyp';
  return true;
}

function forbiddenContent(bytes: Buffer): string | null {
  const probe = bytes.subarray(0, Math.min(bytes.length, 256 * 1024)).toString('utf8').toLowerCase();
  const signatures = ['<script', 'javascript:', 'powershell -enc', 'cmd.exe /c', 'mZ0\u0000'];
  return signatures.find(signature => probe.includes(signature)) || null;
}

export function inspectAttachmentSecurity(input: { data: Buffer; mimeType: string; filename?: string }): AttachmentSecurityResult {
  const data = Buffer.isBuffer(input.data) ? input.data : Buffer.from(input.data || []);
  const mimeType = normalizeMime(input.mimeType);
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  if (data.length === 0) return { state: 'rejected', sha256, bytes: 0, mimeType, scanner: 'builtin', reason: 'empty_attachment' };
  if (data.length > MAX_BYTES) return { state: 'rejected', sha256, bytes: data.length, mimeType, scanner: 'builtin', reason: 'attachment_too_large' };
  const forbidden = forbiddenContent(data);
  if (forbidden) return { state: 'rejected', sha256, bytes: data.length, mimeType, scanner: 'builtin', reason: `forbidden_signature:${forbidden}` };
  if (!magicMatches(mimeType, data)) return { state: 'rejected', sha256, bytes: data.length, mimeType, scanner: 'builtin', reason: 'mime_magic_mismatch' };
  const externalScanner = String(process.env.KURUKOO_MALWARE_SCANNER || '').trim().toLowerCase();
  if (externalScanner && externalScanner !== 'builtin') return { state: 'pending_scan', sha256, bytes: data.length, mimeType, scanner: 'none', reason: `external_scanner_pending:${externalScanner}` };
  return { state: 'accepted', sha256, bytes: data.length, mimeType, scanner: 'builtin' };
}

export function attachmentSecurityReadiness(env: NodeJS.ProcessEnv = process.env): { configured: boolean; scanner: string; note: string } {
  const scanner = String(env.KURUKOO_MALWARE_SCANNER || 'builtin').trim().toLowerCase() || 'builtin';
  if (scanner === 'builtin') return { configured: true, scanner, note: 'Built-in size, MIME/magic, hash and basic payload checks are active. Production malware scanning should add a provider before untrusted public uploads.' };
  if (['clamav', 'clamd', 'cloud_scan'].includes(scanner)) return { configured: true, scanner, note: 'An external malware scanner is declared; attachments remain pending until the scanner result is persisted.' };
  return { configured: false, scanner, note: 'Unknown malware scanner configuration; fail closed.' };
}
