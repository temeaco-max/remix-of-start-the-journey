/**
 * Channel webhooks + USSD — extracted from index.ts (ChatGPT audit plan).
 * Single dispatch via channelRegistry; no parallel channel identity stores.
 */
import { Router } from 'express';
import { dispatchWebhook } from '../channels/channelRegistry.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/webhook/whatsapp', webhookRateLimit, async (req, res) => {
  const result = await dispatchWebhook('whatsapp', req.body, req.headers as Record<string, any>);
  res.status(200).json(result);
});

router.post('/webhook/telegram', webhookRateLimit, async (req, res) => {
  const result = await dispatchWebhook('telegram', req.body, req.headers as Record<string, any>);
  res.status(200).json(result);
});

router.post('/webhook/sms', webhookRateLimit, async (req, res) => {
  const result = await dispatchWebhook('sms', req.body, req.headers as Record<string, any>);
  res.status(200).json(result);
});

router.post('/ussd', webhookRateLimit, async (req, res) => {
  const result = await dispatchWebhook('ussd', req.body, req.headers as Record<string, any>);
  res.set('Content-Type', 'text/plain');
  res.send(result.response || '');
});

export default router;
