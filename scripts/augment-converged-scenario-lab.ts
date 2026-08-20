import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAllConvergedSkillNames, getConvergedSkillBehaviour } from '../src/services/skillBehaviourRegistry.js';
import { buildSkillExecutionContract } from '../src/services/skillExecutionContract.js';

const outputDir = path.join(process.cwd(), 'data', 'scenario-lab');
const scenarioPath = path.join(outputDir, 'provider-outcome-scenarios.jsonl');
const seed = String(process.env.KURUKOO_SCENARIO_SEED || 'kurukoo-provider-outcome-lab-v1');
const markets = [
  { key: 'ng', locale: 'ng:en', dialect: 'nigerian-english', geography: 'Ikeja, Lagos' },
  { key: 'gb', locale: 'gb:en', dialect: 'uk-english', geography: 'London' },
  { key: 'ca', locale: 'ca:en', dialect: 'canadian-english', geography: 'Toronto, Ontario' },
];
const channels = ['web_chat', 'pwa', 'whatsapp', 'telegram', 'email', 'linked_device'];
const variants = [
  ['normal', 'ordinary user request'],
  ['ambiguous', 'request requiring clarification'],
  ['correction', 'user corrects the same request'],
  ['interruption', 'user temporarily switches context'],
  ['recovery', 'provider/capability failure requires recovery'],
] as const;

function hash(input: string): string {
  return crypto.createHash('sha256').update(`${seed}:${input}`).digest('hex');
}
function pick<T>(values: readonly T[], key: string): T {
  return values[Number.parseInt(hash(key).slice(0, 8), 16) % values.length];
}

const baseSkills = new Set((process.env.KURUKOO_BASE_SKILLS || '').split(',').map(v => v.trim()).filter(Boolean));
const existingRows = fs.existsSync(scenarioPath)
  ? fs.readFileSync(scenarioPath, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
  : [];
const existingSkillIds = new Set(existingRows.map(row => String(row.skill || '')));
const convergedSkills = getAllConvergedSkillNames();
const extensions = convergedSkills.filter(skill => !baseSkills.has(skill) && !existingSkillIds.has(skill));

const rows = extensions.map((skill) => {
  const behaviour = getConvergedSkillBehaviour(skill);
  const contract = buildSkillExecutionContract(skill);
  const market = pick(markets, `${skill}:market`);
  const variant = pick(variants, `${skill}:variant`);
  const channel = pick(channels, `${skill}:channel`);
  const label = skill.replace(/_/g, ' ');
  const scenarioId = `conv:${hash(skill).slice(0, 20)}`;
  return {
    scenarioId,
    seed,
    skill,
    family: contract.category,
    mode: contract.mode,
    market: market.key,
    locale: market.locale,
    dialect: market.dialect,
    actor: 'consumer',
    providerType: contract.providerRequired ? 'individual_or_business' : 'none',
    channel,
    linkedDevice: channel === 'linked_device',
    qrContext: false,
    userMessage: variant[0] === 'normal'
      ? `I need help with ${label} in ${market.geography}.`
      : `Help me with ${label} in ${market.geography}; ${variant[1]}.`,
    lifecycleVariant: variant[0],
    lifecycle: variant[1],
    trajectory: [
      { role: 'user', content: `I need help with ${label} in ${market.geography}.`, turn: 1, activeGoals: ['primary_request'] },
      { role: 'assistant', content: `I’ll handle this as a ${contract.mode} request, using the required information and only the capabilities/evidence available to Kurukoo.`, turn: 2, activeGoals: ['primary_request'] },
      { role: 'user', content: variant[1], turn: 3, activeGoals: ['primary_request'] },
    ],
    turnCount: 3,
    horizon: 3,
    activeGoalCount: 1,
    requirements: contract.requirements,
    capabilities: contract.capabilities,
    memoryProfileKeys: contract.memoryProfileKeys,
    evidenceRequirements: contract.evidenceRequirements,
    failureModes: contract.failureModes,
    completionCondition: contract.completionCondition,
    behaviourInstruction: behaviour.instruction,
    truthBoundary: contract.truthBoundary,
    providerRequired: contract.providerRequired,
    paymentRequired: contract.paymentRequired,
    externalDependencies: contract.externalDependencies,
    canonicalEntry: 'canonicalChatTurnService',
    authorityBoundary: 'canonical_domain_services',
    forbiddenClaims: ['live availability', 'provider verification without evidence', 'payment settlement', 'delivery', 'completion without evidence'],
    provenance: { source: 'converged skill registry + execution contract', synthetic: true, productionUserData: false },
  };
});

fs.mkdirSync(outputDir, { recursive: true });
if (rows.length) fs.appendFileSync(scenarioPath, `${rows.map(row => JSON.stringify(row)).join('\n')}\n`);
const report = {
  generatedAt: new Date().toISOString(),
  baseRows: existingRows.length,
  convergedSkillCount: convergedSkills.length,
  appendedSkillCount: rows.length,
  appendedSkills: rows.map(row => row.skill),
};
fs.writeFileSync(path.join(outputDir, 'converged-extension-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[scenario-lab] converged augmentation complete: appended=${rows.length} convergedSkills=${convergedSkills.length}`);
