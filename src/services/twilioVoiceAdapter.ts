/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export interface MaskedCallResult { provider: 'twilio'; callId: string; status: string; from: string; }

function configured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

export function twilioVoiceStatus(): { configured: boolean; provider: 'twilio'; fromConfigured: boolean } {
  return { configured: configured(), provider: 'twilio', fromConfigured: Boolean(process.env.TWILIO_FROM_NUMBER) };
}

export async function placeTwilioMaskedCall(input: { customerPhone: string; providerPhone: string }): Promise<MaskedCallResult> {
  if (!configured()) throw new Error('Twilio masked calling is not configured.');
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID);
  const authToken = String(process.env.TWILIO_AUTH_TOKEN);
  const from = String(process.env.TWILIO_FROM_NUMBER);
  const customerPhone = String(input.customerPhone || '').trim();
  const providerPhone = String(input.providerPhone || '').trim();
  if (!/^\+[1-9]\d{6,14}$/.test(customerPhone) || !/^\+[1-9]\d{6,14}$/.test(providerPhone) || !/^\+[1-9]\d{6,14}$/.test(from)) throw new Error('Twilio masked calling requires E.164 phone numbers.');
  const twiml = `<Response><Say>Kurukoo is connecting your call.</Say><Dial answerOnBridge="true"><Number>${providerPhone.replace(/[&<>"']/g, '')}</Number></Dial></Response>`;
  const body = new URLSearchParams({ To: customerPhone, From: from, Twiml: twiml });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Calls.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok || !payload?.sid) throw new Error(String(payload?.message || `Twilio call creation failed (${response.status}).`));
  return { provider: 'twilio', callId: String(payload.sid), status: String(payload.status || 'queued'), from };
}
