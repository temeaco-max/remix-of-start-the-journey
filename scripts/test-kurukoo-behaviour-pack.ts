import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const packPath = path.join(process.cwd(), 'ml', 'behaviour', 'latest.json');
if (!fs.existsSync(packPath)) throw new Error('Behaviour pack is missing. Run npm run ml:compile-behaviour-pack.');
const pack = JSON.parse(fs.readFileSync(packPath, 'utf8')) as any;
const requiredTop = ['schemaVersion','packVersion','packHash','sourceCommit','constitution','skills','capabilities','agentTools','behaviourFamilies','truthBoundary','safetyBoundary'];
for (const key of requiredTop) if (!(key in pack)) throw new Error(`Behaviour pack missing ${key}`);
if (!pack.skills.length) throw new Error('Behaviour pack contains no skills.');
if (!pack.capabilities.length) throw new Error('Behaviour pack contains no capabilities.');
if (!pack.agentTools.length) throw new Error('Behaviour pack contains no agent tools.');
if (pack.behaviourFamilies.length < 10) throw new Error('Behaviour pack lacks behavioural breadth.');
if (!pack.truthBoundary.mustNotClaimWithoutEvidence.length) throw new Error('Truth boundary is empty.');
if (!pack.safetyBoundary.prohibited.length) throw new Error('Safety boundary is empty.');
const payload = { ...pack };
delete payload.packHash;
const expectedHash = crypto.createHash('sha256').update(JSON.stringify(payload, null, 2)).digest('hex');
if (pack.packHash !== expectedHash) throw new Error('Behaviour pack hash is not reproducible.');
for (const skill of pack.skills) {
  if (!skill.skill || !Array.isArray(skill.capabilities) || !Array.isArray(skill.requirements)) throw new Error(`Invalid skill entry: ${skill.skill}`);
}
for (const capability of pack.capabilities) {
  if (!capability.capability || !Array.isArray(capability.actions) || !capability.activationState) throw new Error(`Invalid capability entry: ${capability.capability}`);
}
console.log(`Behaviour pack passed: ${pack.skills.length} skills, ${pack.capabilities.length} capabilities, ${pack.agentTools.length} agent tools, ${pack.behaviourFamilies.length} behavioural families, hash ${pack.packHash.slice(0, 12)}...`);
