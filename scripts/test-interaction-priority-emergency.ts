/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-emergency-priority-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch {}
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'interaction-policy-emergency-test-key';

const { resolveConversationPriority } = await import('../src/services/conversationPriorityService.js');
const { handleConversationalAuth } = await import('../src/services/conversationalAuthService.js');
const { executeCanonicalCapabilityProposal } = await import('../src/services/canonicalCapabilityExecutor.js');

const priority = resolveConversationPriority('its an emergency and i need an ambulance');
assert.equal(priority.kind, 'emergency');
assert.equal(priority.capability, 'safety');
assert.equal(priority.shouldPreemptCurrentContext, true);
assert.equal(priority.guestAllowedForInitialHandling, true);
assert.equal(priority.requiresAuthenticationBeforeAction, false);
assert.equal(priority.policy.priority, 'critical');
assert.equal(priority.policy.interruption, 'immediate');

const guest = `anon_emergency_${process.pid}`;
const authResult = await handleConversationalAuth(guest, 'its an emergency and i need an ambulance');
assert.equal(authResult.cardData?.type, 'emergency_dispatch');
assert.equal(authResult.cardData?.guestAllowed, true);
assert.equal(authResult.cardData?.authenticationRequired, false);
assert.match(authResult.reply, /do not need to register/i);

const execution = await executeCanonicalCapabilityProposal({
  phone: guest,
  channel: 'web',
  capability: 'safety',
  action: 'emergency_dispatch',
  arguments: { service: 'ambulance', country: 'NG' },
  confirmationRequired: false,
  confidence: 0.99,
  reason: 'critical emergency',
});
assert.equal(execution.status, 'externally_pending');
assert.equal(execution.canonicalFacts.emergencyNumber, '112');
assert.equal(execution.externalActivation, 'repository_ready_external_activation');
assert.ok(execution.nextActions.some(action => action.action === 'dial'));
assert.match(execution.message, /not activated|not claimed/i);

const normalGuest = await executeCanonicalCapabilityProposal({
  phone: `anon_normal_${process.pid}`,
  channel: 'web',
  capability: 'reminder',
  action: 'create',
  arguments: { title: 'Test', dueAt: new Date(Date.now() + 3600000).toISOString() },
});
assert.equal(normalGuest.status, 'unauthorized');

console.log(JSON.stringify({ ok: true, emergencyNumber: execution.canonicalFacts.emergencyNumber, emergencyStatus: execution.status, normalGuestStatus: normalGuest.status }, null, 2));
try { fs.unlinkSync(dbPath); } catch {}
