import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AUTHENTICATED_CAPABILITY_COVERAGE } from '../src/services/authenticatedCapabilityCoverageRegistry.js';
import { PRODUCT_SURFACE_COMPLETENESS } from '../src/services/productSurfaceCompletenessRegistry.js';

const routes = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');
const registry = fs.readFileSync('src/services/platformFeatureVisualRegistry.ts', 'utf8');
const canonical = fs.readFileSync('src/services/canonicalUrlRegistry.ts', 'utf8');
const entrypoints = fs.readFileSync('src/services/clientFeatureEntryPoints.ts', 'utf8');

for (const surface of PRODUCT_SURFACE_COMPLETENESS) {
  assert.ok(surface.purpose, `Missing purpose: ${surface.id}`);
  assert.ok(surface.requiredRepresentations.length >= 3, `Insufficient representation contract: ${surface.id}`);
  assert.ok(surface.requiredStates.length >= 3, `Insufficient state contract: ${surface.id}`);
  for (const url of surface.canonicalUrls) {
    if (url.includes('/:') || url.includes('*')) continue;
    if (url.startsWith('/app/')) continue;
    if (url.startsWith('/admin')) continue;
    assert.ok(canonical.includes(url) || routes.includes(url) || registry.includes(`webSurface:'${url}'`) || registry.includes(`webSurface:'${url}`), `Canonical URL is not represented in route/registry contracts: ${surface.id} -> ${url}`);
  }
}

const capabilityIds = new Set<string>();
const capabilityNames = new Set<string>();
const canonicalOwnersByCapability = new Map<string, string>();
const allowedSurfaces = new Set(['chat', 'desk', 'agents', 'requests', 'tasks', 'notifications', 'contacts', 'memory', 'discover', 'topics', 'opportunities', 'saved', 'cart', 'reminders', 'connect', 'call', 'contextual', 'wallet', 'checkout']);
const allowedStatuses = new Set(['IMPLEMENTED', 'AVAILABLE', 'RUNTIME_VERIFIED', 'BLOCKED_EXTERNAL', 'UNVERIFIED', 'DISABLED', 'FAILED']);

for (const contract of AUTHENTICATED_CAPABILITY_COVERAGE) {
  assert.ok(!capabilityIds.has(contract.id), `Duplicate capability id: ${contract.id}`);
  capabilityIds.add(contract.id);
  assert.ok(!capabilityNames.has(contract.capability), `Duplicate capability name: ${contract.capability}`);
  capabilityNames.add(contract.capability);
  assert.ok(allowedSurfaces.has(contract.canonicalSurface), `Unknown canonical surface: ${contract.id} -> ${contract.canonicalSurface}`);
  assert.ok(contract.canonicalRoute, `Missing canonical route/context: ${contract.id}`);
  assert.ok(!contract.canonicalRoute.includes('/app/'), `Capability retains stale /app/* canonical route: ${contract.id}`);
  assert.ok(contract.primaryAction, `Missing primary action: ${contract.id}`);
  assert.ok(contract.canonicalOwner, `Missing canonical owner: ${contract.id}`);
  assert.ok(contract.continuation, `Missing context continuation: ${contract.id}`);
  assert.ok(contract.verificationBoundary, `Missing verification boundary: ${contract.id}`);
  assert.ok(allowedStatuses.has(contract.runtimeStatus), `Unknown capability status: ${contract.id} -> ${contract.runtimeStatus}`);
  assert.ok(!canonicalOwnersByCapability.has(contract.capability), `Capability has competing canonical owners: ${contract.capability}`);
  canonicalOwnersByCapability.set(contract.capability, contract.canonicalOwner);
  if (contract.canonicalRoute.startsWith('/')) {
    const exact = contract.canonicalRoute.replace(/\?.*$/, '');
    const normalized = exact.includes('/:') ? exact.slice(0, exact.indexOf('/:')) : exact;
    assert.ok(canonical.includes(normalized) || routes.includes(normalized) || registry.includes(normalized), `Capability route/context is not registered: ${contract.id} -> ${contract.canonicalRoute}`);
  }
  if (contract.runtimeStatus === 'RUNTIME_VERIFIED') {
    assert.match(contract.verificationBoundary, /verified|evidence|runtime/i, `Runtime-verified capability lacks explicit verification evidence: ${contract.id}`);
  }
}

assert.equal(AUTHENTICATED_CAPABILITY_COVERAGE.find(item => item.id === 'agent-chat')?.canonicalRoute, '/chat');
assert.equal(AUTHENTICATED_CAPABILITY_COVERAGE.find(item => item.id === 'agents-runtime')?.canonicalRoute, '/agents');
assert.equal(AUTHENTICATED_CAPABILITY_COVERAGE.find(item => item.id === 'agents-runtime')?.canonicalOwner, 'agentRuntime');
assert.ok(!/authenticatedPath:'\/app\//.test(entrypoints), 'Authenticated feature entrypoints must not advertise legacy /app/* paths.');
assert.ok(!entrypoints.includes("'/app"), 'Authenticated feature entrypoint registry must remain free of legacy /app paths.');

for (const requiredId of ['agent-chat','agents-runtime','requests','tasks','notifications','contacts-identity','memory','discover','topics','opportunities','follow','provider-communication','calls','voice','agent-brief','quick-ride','physical-execution','agent-to-agent','saved','cart','reminders','connect','artifacts','safety','wallet-points-topup','subscriptions-checkout','payments']) {
  assert.ok(AUTHENTICATED_CAPABILITY_COVERAGE.some(item => item.id === requiredId), `Required authenticated capability is missing from coverage contract: ${requiredId}`);
}

assert.ok(fs.existsSync('docs/architecture/KURUKOO_BROAD_PRODUCT_COMPLETENESS.md'), 'Broad product completeness contract is missing.');
assert.ok(fs.existsSync('docs/design/KURUKOO_BRAND_PRIMITIVES.md'), 'Brand primitive contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'admin-keys-config'), 'Admin key/config completeness contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'monetisation'), 'Monetisation completeness contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'client-parity'), 'Client parity completeness contract is missing.');

console.log(`Product and authenticated capability completeness passed for ${PRODUCT_SURFACE_COMPLETENESS.length} cross-domain surfaces and ${AUTHENTICATED_CAPABILITY_COVERAGE.length} authenticated capabilities.`);
