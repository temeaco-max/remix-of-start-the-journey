/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Client-side encryption for the Secure Credential Store.
 * Mirrors the backend secureCredentialStore.ts crypto (AES-256-GCM + PBKDF2)
 * but runs entirely in the browser — the plaintext NEVER leaves the client.
 */
const PBKDF2_ITERATIONS = 200_000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase) as BufferSource, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' }, baseKey, { name: ALGORITHM, length: KEY_LENGTH * 8 }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string, passphrase: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv as BufferSource }, key, new TextEncoder().encode(plaintext) as BufferSource);
  return { ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv), salt: toBase64(salt) };
}

export async function decryptSecret(ciphertext: string, iv: string, salt: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase, fromBase64(salt));
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv: fromBase64(iv) as BufferSource }, key, fromBase64(ciphertext) as BufferSource);
  return new TextDecoder().decode(decrypted);
}
