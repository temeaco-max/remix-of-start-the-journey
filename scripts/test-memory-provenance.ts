/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-memory-provenance-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch { /* isolated test path */ }
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'memory-provenance-test-key';

const { updateProfile, getProfile, getMemoryFacts } = await import('../src/services/memoryProfile.js');
const { onboardNewUser } = await import('../src/services/progressiveOnboarding.js');
const { buildWorkingContext, assembleContext } = await import('../src/services/livingMemoryEngine.js');

const phone = '+2348012345678';
await updateProfile(phone, 'test', { name: 'Amina', location: 'Ikeja', provenance: 'user_declared', source_ref: 'chat:onboarding' });
const facts = await getMemoryFacts(phone);
if (!facts.some((fact) => fact.field === 'name' && fact.value === 'Amina' && fact.provenance === 'user_declared')) throw new Error('Explicit name fact was not persisted with user_declared provenance');
if (!facts.some((fact) => fact.field === 'location' && fact.value === 'Ikeja' && fact.provenance === 'user_declared')) throw new Error('Explicit location fact was not persisted with user_declared provenance');

const context = await buildWorkingContext(phone, 'Where do I live?', { route: 'smollm2' });

// A deployment key rotation must fail closed per field instead of crashing Chat.
process.env.MEMORY_ENCRYPTION_KEY = 'rotated-memory-provenance-test-key';
const rotatedProfile = await getProfile(phone, 'rotation-regression');
if (!rotatedProfile || typeof rotatedProfile.preferences !== 'object' || typeof rotatedProfile.behavior_patterns !== 'object') throw new Error('Unreadable encrypted profile fields did not fail closed to empty objects');

const duplicateContext = assembleContext([
  { id: 'stable:one', tier: 'stable', text: 'Subscription: Base; Points: 30', source: 'profile:one', createdAt: '', relevance: 0.5 },
  { id: 'stable:two', tier: 'stable', text: 'Subscription: Base; Points: 30', source: 'profile:two', createdAt: '', relevance: 0.5 },
], 256);
if (duplicateContext.context.split('Subscription: Base; Points: 30').length - 1 !== 1) throw new Error('Living Memory emitted duplicate identical context lines');

const selectedLocation = context.selected.find((item) => item.text.includes('Primary location: Ikeja'));
if (!selectedLocation || !selectedLocation.source.includes('memory_facts.location:user_declared')) throw new Error('Living Memory omitted or mislabelled explicit location provenance');

const newPhone = '+2348098765432';
await onboardNewUser(newPhone);
const newFacts = await getMemoryFacts(newPhone);
if (newFacts.length !== 0) throw new Error('New onboarding user unexpectedly received memory facts before declaration');

console.log('Memory provenance regression passed: explicit facts are persisted and retrieved with provenance; unreadable rotated-key fields fail closed without crashing Chat; new users remain unknown until declaration.');
try { fs.unlinkSync(dbPath); } catch { /* best effort cleanup */ }
