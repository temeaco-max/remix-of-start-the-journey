import 'dotenv/config';

const apiKey = String(process.env.MISTRAL_API_KEY || '').trim();
const model = String(process.env.MISTRAL_MODEL || 'mistral-small-latest').trim();
if (!apiKey) {
  console.error('MISTRAL_API_KEY is not configured.');
  process.exit(2);
}

const started = Date.now();
const response = await fetch(`${String(process.env.MISTRAL_API_BASE || 'https://api.mistral.ai/v1').replace(/\/$/, '')}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'You are performing a Kurukoo provider connectivity probe. Reply with exactly: MISTRAL_OK' },
      { role: 'user', content: 'provider connectivity check' },
    ],
    temperature: 0,
    max_tokens: 16,
  }),
});

const latencyMs = Date.now() - started;
const body = await response.json().catch(() => ({}));
if (!response.ok) {
  const detail = typeof body?.error?.message === 'string' ? body.error.message.slice(0, 240) : `HTTP ${response.status}`;
  console.error(`Mistral probe failed: ${detail}`);
  process.exit(1);
}

const text = String(body?.choices?.[0]?.message?.content || '').trim();
console.log(JSON.stringify({ ok: text === 'MISTRAL_OK', model: String(body?.model || model), latencyMs }, null, 2));
process.exitCode = text === 'MISTRAL_OK' ? 0 : 1;
