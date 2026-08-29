/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import 'dotenv/config';
import QRCode from 'qrcode';
import {
  getWhatsAppLinkedDevicePairingCode,
  getWhatsAppLinkedDeviceStatus,
  startWhatsAppLinkedDevice,
  stopWhatsAppLinkedDevice,
} from '../src/services/whatsappLinkedDeviceService.js';

if (process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED !== 'true') process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED = 'true';
if (process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW !== 'true') process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW = 'true';

if (!process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE) {
  console.error('Set KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE to the authenticated Kurukoo owner phone before starting.');
  process.exit(1);
}

await startWhatsAppLinkedDevice();
console.log('Kurukoo linked-device connector started. Open WhatsApp on the owner phone and use Linked devices → Link a device.');
let lastQr = '';
const statusTimer = setInterval(async () => {
  const qr = getWhatsAppLinkedDevicePairingCode();
  if (qr && qr !== lastQr) {
    lastQr = qr;
    console.log(await QRCode.toString(qr, { type: 'terminal', small: true }));
  }
  const status = getWhatsAppLinkedDeviceStatus();
  console.log(`[WhatsApp linked device] state=${status.state} connected=${status.connected}`);
  if (status.lastError) console.warn(`[WhatsApp linked device] ${status.lastError}`);
}, 4000);

const shutdown = async () => {
  clearInterval(statusTimer);
  await stopWhatsAppLinkedDevice(false);
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
