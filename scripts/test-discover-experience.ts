import assert from 'node:assert/strict';
import { getDb, saveDb } from '../src/database.js';
import { upsertDiscoveryEntity } from '../src/services/discoveryNetwork.js';
import { getDiscoverHome, recordDiscoverAction, removeDiscoverAction } from '../src/services/discoverExperience.js';

const id = `discover-contract-${Date.now()}`;
const phone = `discover-contract-user-${Date.now()}`;
const db = await getDb();
try {
  await upsertDiscoveryEntity({ id, entityType: 'business', lifecycle: 'opportunity', name: 'Contract daily pick', detail: '10% discount today', category: 'food', source: 'contract-test', latitude: 6.5244, longitude: 3.3792, freshnessAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 6 * 60 * 60_000).toISOString(), evidenceLevel: 'verified_state', claimed: true, verified: true, available: true });
  const home = await getDiscoverHome({ latitude: 6.5244, longitude: 3.3792, radiusMetres: 10000 }, phone);
  const item = [...home.sections.for_you, ...home.sections.today, ...home.sections.opportunities].find((candidate) => candidate.id === id);
  assert.ok(item, 'live discovery entity should enter unified Discover feed');
  assert.equal(item?.verified, true);
  assert.equal(item?.available, true);
  assert.equal(item?.sponsored, false);
  const action = await recordDiscoverAction(phone, 'discovery', id, 'watch');
  assert.equal(action.ok, true);
  const watched = await getDiscoverHome({ latitude: 6.5244, longitude: 3.3792, radiusMetres: 10000 }, phone);
  assert.ok(watched.watchedItemIds.includes(`discovery:${id}`), 'watch must persist into Discover state');
  await removeDiscoverAction(phone, 'discovery', id, 'watch');
  console.log(JSON.stringify({ passed: true, density: home.density, sections: Object.fromEntries(Object.entries(home.sections).map(([key, items]) => [key, items.length])) }, null, 2));
} finally {
  db.run('DELETE FROM discovery_entities WHERE id=?', [id]);
  db.run('DELETE FROM discover_interests WHERE phone=?', [phone]);
  saveDb(true);
}
