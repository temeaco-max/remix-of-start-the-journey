import fs from 'node:fs';
import path from 'node:path';
import { getEconomicCategory, getKnownSkills, getSkillCapabilities, getSkillFlow } from '../src/services/skillFlows.js';

const datasetVersion = String(process.env.KURUKOO_DATASET_VERSION || 'kurukoo-core-v1');
const outputDir = path.join(process.cwd(), 'ml', 'datasets');
const outputPath = path.join(outputDir, `${datasetVersion}.jsonl`);
const manifestPath = path.join(outputDir, `${datasetVersion}.manifest.json`);
const actors = ['consumer', 'provider', 'business', 'contributor', 'agent', 'support_operator'];
const channels = ['web_chat', 'pwa', 'whatsapp', 'telegram', 'sms', 'ussd', 'email', 'voice', 'linked_device'];
const variants = [
  { key: 'normal', user: (skill: string) => `I need help with ${skill.replaceAll('_', ' ')}.`, lifecycle: 'requested' },
  { key: 'ambiguity', user: (skill: string) => `Can you handle ${skill.replaceAll('_', ' ')} for me, or do I need to find someone myself?`, lifecycle: 'clarifying' },
  { key: 'interruption', user: (skill: string) => `Before we continue with ${skill.replaceAll('_', ' ')}, I need to ask about something else.`, lifecycle: 'paused' },
  { key: 'correction', user: (skill: string) => `Correction: the details I gave for ${skill.replaceAll('_', ' ')} were wrong. Please update the request, not a different one.`, lifecycle: 'clarifying' },
  { key: 'unavailable', user: (skill: string) => `If no verified option is available for ${skill.replaceAll('_', ' ')}, tell me honestly and offer a safe next step.`, lifecycle: 'failed' },
  { key: 'consent', user: (skill: string) => `What do you need my consent or confirmation for before proceeding with ${skill.replaceAll('_', ' ')}?`, lifecycle: 'awaiting_confirmation' },
  { key: 'channel', user: (skill: string) => `Continue my ${skill.replaceAll('_', ' ')} request from this channel and keep the same context.`, lifecycle: 'resumed' },
  { key: 'recovery', user: (skill: string) => `The ${skill.replaceAll('_', ' ')} request did not complete. Help me recover or resume it without creating a duplicate.`, lifecycle: 'failed' },
  { key: 'linked_device', user: (skill: string) => `I am continuing my ${skill.replaceAll('_', ' ')} request from a linked device. Keep the same identity and object context.`, lifecycle: 'resumed' },
];

function createExample(skill: string, index: number, flow: Awaited<ReturnType<typeof getSkillFlow>>) {
  const variant = variants[index % variants.length];
  const actor = actors[index % actors.length];
  const channel = channels[index % channels.length];
  const capabilities = getSkillCapabilities(skill);
  const category = getEconomicCategory(skill);
  const requirementKeys = (flow?.requirements || []).map((requirement) => requirement.key);
  return {
    exampleId: `${datasetVersion}:${skill}:${variant.key}:${index}`,
    datasetVersion,
    messages: [
      { role: 'user', content: variant.user(skill), actor, channel },
      { role: 'assistant', content: 'Interpret the objective, preserve active context, gather only the required information, and state any unavailable capability or external dependency truthfully.', mode: 'semantic_interpreter' },
    ],
    labels: {
      skill,
      family: category || 'uncategorized',
      mode: flow?.mode || 'economic',
      variant: variant.key,
      lifecycle: variant.lifecycle,
      capabilities,
      requirementKeys,
      actor,
      channel,
      canonicalEntry: 'canonicalChatTurnService',
      authorityBoundary: 'canonical_domain_services',
      forbiddenClaims: ['invented availability', 'invented provider verification', 'invented payment', 'invented evidence', 'direct state mutation by model'],
    },
    provenance: {
      source: 'canonical Kurukoo ontology',
      generatedBy: 'deterministic repository generator',
      teacherGenerated: false,
      productionUserData: false,
      reviewed: false,
    },
    quality: { status: 'candidate', requiresReview: true, scenarioFamily: 'outcome-first-context-arbitration' },
    privacy: { containsPersonalData: false, synthetic: true },
  };
}

fs.mkdirSync(outputDir, { recursive: true });
const lines: string[] = [];
for (const skill of getKnownSkills()) {
  const flow = await getSkillFlow(skill);
  for (let index = 0; index < variants.length; index += 1) lines.push(JSON.stringify(createExample(skill, index, flow)));
}
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
const manifest = {
  datasetVersion,
  generatedAt: new Date().toISOString(),
  exampleCount: lines.length,
  skillCount: getKnownSkills().length,
  variantCount: variants.length,
  actorCoverage: actors,
  channelCoverage: channels,
  variantCoverage: variants.map((variant) => variant.key),
  sourceOfTruth: ['src/services/skillFlows.ts', 'src/services/canonicalChatTurnService.ts', 'src/services/featureFlags.ts'],
  teacherOutputAllowed: true,
  teacherOutputTrustedAutomatically: false,
  productionUserDataIncluded: false,
  trainingIsNotRuntimeAuthority: true,
  status: 'candidate_dataset_requires_validation_and_curation',
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
