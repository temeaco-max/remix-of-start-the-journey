import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const blueprint = read('BLUEPRINT.md');
const database = read('src/database.ts');
const router = read('src/services/intentRouter.ts');
const skillFlows = read('src/services/skillFlows.ts');
const servicesDir = path.join(root, 'src/services');
const serviceFiles = fs.readdirSync(servicesDir).filter(name => name.endsWith('.ts'));

// The canonical skill catalogue lives in skillFlows.ts. Older versions of this
// audit looked for a database object literal (`s: 'skill'`) and therefore
// reported zero skills even though the taxonomy contained the full catalogue.
const seededSkills = [
  ...skillFlows.matchAll(/^\s*([a-z0-9_]+):\s*['"]/gm),
].map(m => m[1]);
const actionIntents = [...router.matchAll(/['"]([a-z0-9_]+)['"]/g)].map(m => m[1]);
const uniqueSkills = [...new Set(seededSkills)];
const blueprintSections = [...blueprint.matchAll(/^##+\s+(.+)$/gm)].map(m => m[1].trim());
const requiredMandate = [
  ['memory profile', /memory_profiles|Memory Profile/i],
  ['unified messages', /messages.*table|unified.*messages/i],
  ['presence', /presence|Nearby Pulse/i],
  ['points', /Points|points economy/i],
  ['proactive intelligence', /Proactive|Opportunity Engine/i]
];

const failures = [];
if (uniqueSkills.length < 60) failures.push(`Only ${uniqueSkills.length} canonical skill definitions found; expected the blueprint's broad skill catalogue.`);
for (const [name, pattern] of requiredMandate) if (!pattern.test(skillFlows + router + blueprint)) failures.push(`Missing mandate integration: ${name}`);
if (!router.includes('classifyWithFastText')) failures.push('Intent router is not connected to FastText.');
if (!router.includes('queryUnifiedAI')) failures.push('Intent router is not connected to the unified AI engine.');
if (!router.includes('getSkillFlow')) failures.push('Intent router bypasses the shared skill-flow service.');
if (!router.includes('artist_booking')) failures.push('Creator/artist booking is not represented in the chat action layer.');

console.log(JSON.stringify({
  seededSkillCount: uniqueSkills.length,
  actionIntentLiteralCount: new Set(actionIntents).size,
  serviceCount: serviceFiles.length,
  blueprintSectionCount: blueprintSections.length,
  mandateChecks: Object.fromEntries(requiredMandate.map(([name, pattern]) => [name, pattern.test(skillFlows + router + blueprint)])),
  failures
}, null, 2));

if (failures.length) process.exitCode = 1;
