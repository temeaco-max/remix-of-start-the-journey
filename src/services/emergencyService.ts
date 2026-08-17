export type EmergencyServiceType = 'ambulance' | 'police' | 'fire';
export type EmergencyDialState = 'dial_requested' | 'dialing' | 'ringing' | 'connected' | 'ended' | 'failed' | 'unavailable';

export interface EmergencyDirectoryRecord {
  country: string;
  jurisdiction: string;
  area: string;
  serviceType: EmergencyServiceType;
  organisation: string;
  officialNumber: string;
  emergencyNumber: string;
  source: string;
  sourceAuthority: string;
  lastVerified: string;
  verificationState: 'authoritative_public_source';
  geographicApplicability: string;
  dialCapability: 'browser_tel_link' | 'provider_required';
  fallback: string;
}

export interface EmergencySession {
  id: string;
  phone: string;
  serviceType: EmergencyServiceType;
  location?: { value: string; approximate: boolean; source: 'user' | 'trusted_profile' | 'device' | 'manual' };
  dialState: EmergencyDialState;
  startedAt: string;
  endedAt?: string;
}

const NIGERIA_SOURCE = 'https://ncc.gov.ng/media-centre/press-releases/news-release-nccs-112-emergency-number-central-successful';
const DIRECTORY: EmergencyDirectoryRecord[] = (['ambulance', 'police', 'fire'] as EmergencyServiceType[]).map(serviceType => ({
  country: 'NG', jurisdiction: 'national', area: 'all Nigeria', serviceType,
  organisation: 'Nigeria national emergency route', officialNumber: '112', emergencyNumber: '112',
  source: NIGERIA_SOURCE, sourceAuthority: 'Nigerian Communications Commission', lastVerified: '2026-08-17',
  verificationState: 'authoritative_public_source', geographicApplicability: 'Nigeria nationwide; local routing may vary',
  dialCapability: 'browser_tel_link', fallback: 'If 112 cannot be reached, use the local emergency service number shown by an authoritative local authority; Kurukoo does not invent one.'
}));
const sessions = new Map<string, EmergencySession>();

export function detectEmergencyIntent(message: string): boolean {
  return /\b(?:emergency|ambulance|police|fire|fire service|unconscious|attacking me|someone is attacking|immediate danger|life[- ]threatening|distress|need help now|don['’]?t know exactly where i am|do not know exactly where i am)\b/i.test(message)
    && !/\b(?:emergency|safety)\s+contact\b/i.test(message);
}

export function isEmergencyCancellation(message: string): boolean {
  return /\b(?:not an emergency|no longer an emergency|cancel the emergency|false alarm|emergency is over)\b/i.test(message);
}

function requestedService(message: string, current?: EmergencyServiceType): EmergencyServiceType {
  if (/\bambulance|medical|unconscious|paramedic|hospital\b/i.test(message)) return 'ambulance';
  if (/\bpolice|attacking|assault|threat|robbery\b/i.test(message)) return 'police';
  if (/\bfire|smoke|burning\b/i.test(message)) return 'fire';
  return current || 'ambulance';
}

function locationFromMessage(message: string): EmergencySession['location'] {
  const match = message.match(/\b(?:at|in|near|around)\s+([^.!?]{2,80})/i);
  return match ? { value: match[1].trim(), approximate: true, source: 'user' } : undefined;
}

export function getEmergencyDirectory(serviceType?: EmergencyServiceType): EmergencyDirectoryRecord[] {
  return DIRECTORY.filter(record => !serviceType || record.serviceType === serviceType).map(record => ({ ...record }));
}

export function getEmergencySession(phone: string): EmergencySession | null { return sessions.get(phone) || null; }

export function handleEmergencyTurn(phone: string, message: string): { session: EmergencySession | null; reply: string; cardData: any; canonicalAction: string } | null {
  const current = sessions.get(phone);
  if (current && isEmergencyCancellation(message)) {
    const ended = { ...current, dialState: 'ended' as const, endedAt: new Date().toISOString() };
    sessions.set(phone, ended);
    return { session: ended, reply: 'Understood. I have ended the Kurukoo emergency mode. I did not claim that responders were contacted or dispatched. You can return to your earlier conversation whenever you are ready.', cardData: { type: 'emergency', session: ended, status: 'ended', truthful: true }, canonicalAction: 'emergency.end' };
  }
  if (!detectEmergencyIntent(message) && !isEmergencyCancellation(message)) return null;
  const serviceType = requestedService(message, current?.serviceType);
  const location = locationFromMessage(message) || current?.location;
  const asksToCall = /\b(?:call|dial|ring|connect me to|contact)\b/i.test(message);
  const session: EmergencySession = current ? { ...current, serviceType, location, dialState: asksToCall ? 'dial_requested' : current.dialState } : { id: `emergency:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, phone, serviceType, location, dialState: asksToCall ? 'dial_requested' : 'unavailable', startedAt: new Date().toISOString() };
  sessions.set(phone, session);
  const directory = DIRECTORY.find(record => record.serviceType === serviceType)!;
  const locationText = location ? `I have the location as ${location.value} (approximate).` : 'I do not have your location yet. You can share an approximate location or tell me where you are; do not wait to call if you are in immediate danger.';
  const dialText = asksToCall ? `I can present the verified ${directory.emergencyNumber} dial option, but I cannot claim a call connected until a real telephony boundary provides evidence.` : `If you need to speak to emergency services now, use the verified ${directory.emergencyNumber} route.`;
  return { session, reply: `Emergency mode is active for ${serviceType}. ${locationText} ${dialText} Kurukoo is a coordination interface, not an emergency responder; I will not claim dispatch, availability, diagnosis, or connection without evidence.`, cardData: { type: 'emergency', session, service: directory, status: session.dialState, actions: [{ id: 'dial', label: `Call ${directory.emergencyNumber}`, href: `tel:${directory.emergencyNumber}`, canonicalAction: 'emergency.dial' }, { id: 'share_location', label: 'Share approximate location', canonicalAction: 'emergency.location' }, { id: 'end', label: 'End emergency mode', canonicalAction: 'emergency.end' }], locationStatus: location ? 'approximate' : 'unknown', truthful: true }, canonicalAction: asksToCall ? 'emergency.dial' : 'emergency.assess' };
}
