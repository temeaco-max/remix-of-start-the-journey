import { getAllCapabilityInteractionPolicies, type CapabilityInteractionPolicy } from '../src/services/capabilityInteractionPolicyService.js';

const policies = await getAllCapabilityInteractionPolicies();
if (policies.length < 200) throw new Error(`Expected the universal catalog to expose at least 200 capabilities; got ${policies.length}`);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

for (const policy of policies) {
  assert(Boolean(policy.capability), 'Every interaction policy must identify its capability');
  assert(policy.resumable, `${policy.capability}: every capability must preserve a resumable conversation boundary`);
  assert(policy.failureMustPreserveContext, `${policy.capability}: failures must preserve context`);
  if (policy.exactIdentityRequired) {
    assert(policy.authentication === 'required_before_action' || policy.guestAccess === 'allowed_for_initial_help', `${policy.capability}: exact-identity actions must have an auth rule`);
  }
  if (policy.priority === 'critical') {
    assert(policy.interruption === 'immediate', `${policy.capability}: critical capabilities must interrupt immediately`);
    assert(policy.preemptsOtherGoals, `${policy.capability}: critical capabilities must preempt unrelated goals`);
    assert(policy.preservesPriorGoals, `${policy.capability}: critical interruption must preserve prior goals for later resumption`);
  }
  if (policy.confirmation === 'explicit') {
    assert(policy.exactIdentityRequired, `${policy.capability}: explicit confirmation actions must identify their canonical target exactly`);
  }
  if (policy.autonomy === 'long_running') {
    assert(policy.backgroundAllowed, `${policy.capability}: long-running capabilities must be background-capable`);
  }
  if (policy.voiceMode === 'preferred' || policy.voiceMode === 'required') {
    assert(policy.externalEvidenceRequired || policy.capability.includes('voice') || policy.capability.includes('emergency') || policy.capability.includes('safety'), `${policy.capability}: voice-preferred actions need an explicit evidence boundary`);
  }
}

const byName = (name: string): CapabilityInteractionPolicy | undefined => policies.find(policy => policy.capability === name);
const reminders = policies.filter(policy => /reminder/i.test(policy.capability));
for (const policy of reminders) {
  assert(policy.interruption === 'at_trigger', `${policy.capability}: reminders must be interruptible at trigger time`);
  assert(policy.backgroundAllowed, `${policy.capability}: reminders must support background operation`);
  assert(policy.resumable, `${policy.capability}: reminders must preserve the interrupted conversation`);
}

const agents = policies.filter(policy => /agent/i.test(policy.capability));
for (const policy of agents) {
  assert(policy.autonomy === 'long_running', `${policy.capability}: first-class agents must be long-running`);
  assert(policy.backgroundAllowed, `${policy.capability}: agents must support background operation`);
  assert(policy.exactIdentityRequired, `${policy.capability}: agent actions require exact goal identity`);
}

const payment = policies.filter(policy => /payment|escrow|checkout|subscription/i.test(policy.capability));
for (const policy of payment) {
  assert(policy.confirmation === 'explicit', `${policy.capability}: economic actions require explicit confirmation`);
  assert(policy.exactIdentityRequired, `${policy.capability}: economic actions require exact identity`);
}

const remote = policies.filter(policy => /remote|device|linked_device|voice|webrtc|call|dial/i.test(policy.capability));
for (const policy of remote) {
  assert(policy.exactIdentityRequired, `${policy.capability}: remote/device actions require exact identity`);
}

const memory = policies.filter(policy => /memory/i.test(policy.capability));
for (const policy of memory) assert(policy.confirmation === 'explicit', `${policy.capability}: memory persistence/deletion must be explicit`);

console.log(JSON.stringify({
  ok: true,
  capabilityCount: policies.length,
  reminderCount: reminders.length,
  agentCount: agents.length,
  paymentCount: payment.length,
  remoteCount: remote.length,
  memoryCount: memory.length,
  criticalCount: policies.filter(policy => policy.priority === 'critical').length,
}, null, 2));
