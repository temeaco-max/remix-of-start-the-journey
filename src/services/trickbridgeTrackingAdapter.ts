export interface TrickbridgeSession { id: string; providerSessionId: string; status: 'local' | 'connected' | 'unavailable'; externalReference?: string; }

function baseUrl(): string { return String(process.env.TRICKBRIDGE_BASE_URL || '').trim().replace(/\/$/, ''); }
export function trickbridgeStatus(): { configured: boolean; baseUrl?: string } { const url=baseUrl(); return { configured: Boolean(url), baseUrl: url || undefined }; }

export async function createTrickbridgeSession(input: { providerSessionId: string; providerPhone: string }): Promise<TrickbridgeSession> {
  const url = baseUrl();
  if (!url) return { id: `local:${input.providerSessionId}`, providerSessionId: input.providerSessionId, status: 'local' };
  const response = await fetch(`${url}/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.TRICKBRIDGE_API_KEY ? { Authorization: `Bearer ${process.env.TRICKBRIDGE_API_KEY}` } : {}) }, body: JSON.stringify({ providerSessionId: input.providerSessionId, providerPhone: input.providerPhone }) });
  const body = await response.json().catch(() => ({})) as any;
  if (!response.ok || !body?.id) throw new Error(String(body?.error || `Trickbridge session creation failed (${response.status}).`));
  return { id: String(body.id), providerSessionId: input.providerSessionId, status: 'connected', externalReference: body.reference ? String(body.reference) : undefined };
}

export async function publishTrickbridgeLocation(input: { bridgeSessionId: string; latitude: number; longitude: number; timestamp?: string }): Promise<void> {
  const url = baseUrl();
  if (!url || input.bridgeSessionId.startsWith('local:')) return;
  const response = await fetch(`${url}/sessions/${encodeURIComponent(input.bridgeSessionId)}/location`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.TRICKBRIDGE_API_KEY ? { Authorization: `Bearer ${process.env.TRICKBRIDGE_API_KEY}` } : {}) }, body: JSON.stringify({ latitude: input.latitude, longitude: input.longitude, timestamp: input.timestamp || new Date().toISOString() }) });
  if (!response.ok) throw new Error(`Trickbridge location update failed (${response.status}).`);
}

export async function endTrickbridgeSession(bridgeSessionId: string): Promise<void> {
  const url = baseUrl();
  if (!url || bridgeSessionId.startsWith('local:')) return;
  await fetch(`${url}/sessions/${encodeURIComponent(bridgeSessionId)}`, { method: 'DELETE', headers: process.env.TRICKBRIDGE_API_KEY ? { Authorization: `Bearer ${process.env.TRICKBRIDGE_API_KEY}` } : {} }).catch(() => undefined);
}
