/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync(new URL('../src/services/externalActivationService.ts', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../src/routes/adminPlatformRoutes.ts', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const baseChannel = fs.readFileSync(new URL('../src/channels/baseChannelService.ts', import.meta.url), 'utf8');
const whatsapp = fs.readFileSync(new URL('../src/channels/whatsapp.ts', import.meta.url), 'utf8');
const telegram = fs.readFileSync(new URL('../src/channels/telegram.ts', import.meta.url), 'utf8');

assert.match(service, /getMe/);
assert.match(service, /setWebhook/);
assert.match(service, /subscribed_apps/);
assert.match(service, /api\.stripe\.com\/v1\/account/);
assert.match(service, /api\.resend\.com\/domains/);
assert.match(admin, /router\.post\('\/activate'/);
assert.match(admin, /router\.get\('\/external-probe'/);
assert.match(index, /activateConfiguredExternalProviders/);
assert.match(index, /KURUKOO_EXTERNAL_AUTO_ACTIVATE/);
assert.match(baseChannel, /claimInboundWebhook/);
assert.match(whatsapp, /claimInboundWebhook/);
assert.match(whatsapp, /attempt < 3/);
assert.match(telegram, /attempt < 3/);
console.log('External activation contract passed: activation, boot wiring, webhook idempotency and outbound retries are present.');
