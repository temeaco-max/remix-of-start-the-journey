import assert from 'node:assert/strict';
import { listUniversalCapabilities } from '../src/services/universalCapabilityProtocol.js';
import { ensureCapabilityFoundation } from '../src/services/capabilityFoundation.js';
import { resolveSkillCapabilityPlan } from '../src/services/capabilityFoundationIntegration.js';
import { resolveCapabilityLifecycle, canCapabilityBeUsedForAutonomousObservation, canCapabilityBeUsedForAutonomousAction } from '../src/services/capabilityLifecycleService.js';

ensureCapabilityFoundation();
const catalog = await listUniversalCapabilities();
assert.ok(catalog.length >= 205, 'canonical catalog must retain all known skills');
assert.ok(catalog.some(item => item.capability === 'atomic.discovery'), 'atomic discovery capability must exist');
assert.ok(catalog.some(item => item.capability === 'atomic.execute'), 'atomic execute capability must exist');

const workerPlan = resolveSkillCapabilityPlan('find_worker');
assert.ok(workerPlan && workerPlan.length > 0, 'find_worker must resolve to reusable capabilities');
assert.ok(workerPlan.some(item => item.includes('atomic.discovery')), 'provider-led skills must compose discovery');
assert.ok(workerPlan.some(item => item.includes('atomic.quote')), 'provider-led skills must compose quote');

const repairPlan = resolveSkillCapabilityPlan('repair');
assert.ok(repairPlan && repairPlan.some(item => item.includes('atomic.evidence')), 'repair must compose evidence');

const discovery = resolveCapabilityLifecycle('atomic.discovery');
assert.equal(discovery?.available, true);
assert.equal(discovery?.risk, 'read_only');
assert.equal(canCapabilityBeUsedForAutonomousObservation('atomic.discovery'), true);
assert.equal(canCapabilityBeUsedForAutonomousAction('atomic.payment'), true, 'payment is execution-capable but remains confirmation-gated by policy');
assert.equal(canCapabilityBeUsedForAutonomousAction('atomic.control'), true, 'device control is discoverable through the common fabric; canonical action policy remains authoritative');

const payment = resolveCapabilityLifecycle('atomic.payment');
assert.equal(payment?.confirmationRequired, true);
assert.equal(payment?.activationState, 'repository_ready_external_activation');

console.log(`Capability composability regression passed: ${catalog.length} descriptors, reusable atomic plans, lifecycle metadata, and autonomous eligibility primitives verified.`);
