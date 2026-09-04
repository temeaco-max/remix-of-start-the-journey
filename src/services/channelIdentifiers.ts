/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Canonical conversation channel registry (AGENTS.md §31).
 *
 * Every channel that delivers a user turn to Kurukoo funnels through the single
 * canonical chat turn (processCanonicalChatTurn) with a `channel` identifier.
 * This module is the one authority for those identifiers, so a misspelled or
 * client-supplied channel cannot silently create an untracked conversation
 * surface, and adding a channel is an explicit, reviewable change here rather
 * than a free-form string scattered across call sites.
 */
export const Channel = Object.freeze({
  WEB: 'web',
  WEB_VOICE: 'web_voice',
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  AGENT: 'agent',
  SMS: 'sms',
});

const KNOWN_CHANNELS = new Set<string>(Object.values(Channel));

/** True when the channel is one Kurukoo explicitly registers as a turn surface. */
export function isKnownChannel(value: string): boolean {
  return KNOWN_CHANNELS.has(String(value || '').trim());
}

/**
 * Normalize an untrusted or free-form channel identifier to a known canonical
 * channel, defaulting to the web conversation surface. Returns `null` when the
 * input is non-empty but not a Kurukoo-registered turn channel, so callers can
 * reject rather than silently mislabel an inbound message.
 */
export function normalizeChannel(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return Channel.WEB;
  if (KNOWN_CHANNELS.has(raw)) return raw;
  // Recognize delivery-surface spellings that have historically reached the
  // turn boundary without being canonical turn surfaces.
  const lower = raw.toLowerCase();
  if (lower === 'chat' || lower === 'web_chat') return Channel.WEB;
  if (lower === 'voice' || lower === 'web-voice') return Channel.WEB_VOICE;
  if (lower === 'whats-app' || lower === 'whatsapp_business' || lower === 'meta_whatsapp') return Channel.WHATSAPP;
  return null;
}