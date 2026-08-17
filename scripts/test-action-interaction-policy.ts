import { deriveActionInteractionPolicy } from '../src/services/actionInteractionPolicyService.js';
import type { UniversalCapabilityDescriptor } from '../src/services/universalCapabilityProtocol.js';

const descriptor = (capability: string, family: string, mode: UniversalCapabilityDescriptor['mode'], actions: string[], risk: UniversalCapabilityDescriptor['risk']): UniversalCapabilityDescriptor => ({
  capability,
  family,
  mode,
  actions,
  risk,
  activationState: 'locally_available',
  context: { requiredInputs: [], optionalInputs: [] },
  owner: 'test',
  lifecycle: ['available'],
  evidence: { level: 'none' },
  continuation: { resumable: true },
  externalDependencies: [],
} as UniversalCapabilityDescriptor);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const reminder = descriptor('reminder', 'native-assistance', 'state_change', ['create', 'open', 'cancel'], 'low_risk');
const reminderCreate = deriveActionInteractionPolicy(reminder, 'create');
const reminderOpen = deriveActionInteractionPolicy(reminder, 'open');
assert(reminderCreate.authentication === 'required_before_action', 'reminder.create must remain account-scoped');
assert(reminderCreate.exactIdentityRequired, 'reminder.create must preserve owner identity');
assert(reminderOpen.authentication === 'none', 'reminder.open should not require mutation authorization');

const payment = descriptor('payment', 'commerce', 'state_change', ['inspect', 'authorize'], 'confirmation_required');
const paymentInspect = deriveActionInteractionPolicy(payment, 'inspect');
const paymentAuthorize = deriveActionInteractionPolicy(payment, 'authorize');
assert(paymentInspect.authentication === 'none', 'payment.inspect should be read-only');
assert(paymentInspect.confirmation === 'none', 'payment.inspect must not ask for authorization');
assert(paymentAuthorize.authentication === 'required_before_action', 'payment.authorize must require ownership');
assert(paymentAuthorize.confirmation === 'explicit', 'payment.authorize must require explicit confirmation');
assert(paymentAuthorize.exactIdentityRequired, 'payment.authorize must preserve exact payment identity');

const memory = descriptor('memory', 'memory', 'state_change', ['read', 'forget'], 'low_risk');
const memoryRead = deriveActionInteractionPolicy(memory, 'read');
const memoryForget = deriveActionInteractionPolicy(memory, 'forget');
assert(memoryRead.confirmation === 'none', 'memory.read must remain read-only');
assert(memoryForget.confirmation === 'explicit', 'memory.forget must be explicit');
assert(memoryForget.exactIdentityRequired, 'memory.forget must target exact memory identity');

const remote = descriptor('remote.device.control', 'device-control', 'external_execution', ['inspect', 'execute'], 'confirmation_required');
const remoteInspect = deriveActionInteractionPolicy(remote, 'inspect');
const remoteExecute = deriveActionInteractionPolicy(remote, 'execute');
assert(remoteInspect.confirmation === 'none', 'remote inspect should not require action confirmation');
assert(remoteExecute.authentication === 'required_before_action', 'remote execution requires authentication');
assert(remoteExecute.confirmation === 'explicit', 'remote execution requires confirmation');
assert(remoteExecute.exactIdentityRequired, 'remote execution requires exact device identity');

console.log(JSON.stringify({ ok: true, checked: 9 }, null, 2));
