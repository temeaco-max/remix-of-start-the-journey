import assert from 'node:assert/strict';
import { getDiscoveryEntity, inviteContributorToDiscoveryEntity, queryDiscoveryEntities, transitionDiscoveryEntity, upsertDiscoveryEntity } from '../src/services/discoveryNetwork.js';
import { processCanonicalChatTurn } from '../src/services/canonicalChatTurnService.js';

const id = `test-discovery:${Date.now()}`;
await upsertDiscoveryEntity({
  id,
  entityType: 'business',
  lifecycle: 'discovered',
  name: 'Attributed test place',
  detail: 'Source-attributed test discovery',
  category: 'repairs',
  source: 'owned-cache:test',
  sourceRef: 'internal-test-reference',
  latitude: 6.5244,
  longitude: 3.3792,
  freshnessAt: new Date().toISOString(),
  evidenceLevel: 'source_attributed',
  claimed: false,
  verified: false,
  available: false,
});

const queried = await queryDiscoveryEntities({ latitude: 6.5244, longitude: 3.3792, radiusMetres: 1000, category: 'repairs', limit: 10, cluster: false });
const entity = queried.entities.find((item) => item.id === id);
assert.ok(entity, 'canonical discovery query should return the attributed entity');
assert.equal(entity?.lifecycle, 'discovered');
assert.equal(entity?.verified, false);
assert.equal(entity?.available, false);
assert.equal(entity?.source, 'owned-cache:test');

const selected = await getDiscoveryEntity(id);
assert.ok(selected, 'exact discovery context should resolve by canonical entity id');
assert.equal(selected?.id, id);
const chatContext = await processCanonicalChatTurn({ phone: '+2348030012345', message: 'Review this exact discovery context', channel: 'web', contextAction: { type: 'open_discovery_entity', entityId: id } });
assert.equal(chatContext.cardData?.type, 'discovery_context');
assert.equal(chatContext.cardData?.entityId, id, 'Chat must preserve the exact canonical discovery entity id');
assert.equal(chatContext.canonicalAction, 'discovery.context.open');
const missingContext = await processCanonicalChatTurn({ phone: '+2348030012345', message: 'Review this unavailable context', channel: 'web', contextAction: { type: 'open_discovery_entity', entityId: `${id}:missing` } });
assert.equal(missingContext.cardData?.type, 'discovery_context_unavailable');
assert.equal(missingContext.canonicalAction, 'discovery.context.unavailable');

await assert.rejects(() => transitionDiscoveryEntity(id, 'available', '+2348011111111', 'test'), /Invalid discovery lifecycle transition/);
await transitionDiscoveryEntity(id, 'candidate', '+2348011111111', 'test');
await transitionDiscoveryEntity(id, 'opportunity', '+2348011111111', 'test');
const invitation = await inviteContributorToDiscoveryEntity(id, '+2348011111111', '+2348022222222');
assert.equal(invitation.status, 'invited');
assert.equal(invitation.entityId, id);
assert.notEqual(invitation.id, '+2348022222222', 'invitation identity must not become a fake account');

console.log('Discovery Network regression passed: canonical entity lookup, lifecycle truth, source attribution, bounded query, and attributable invitation without fake provider/user creation.');
