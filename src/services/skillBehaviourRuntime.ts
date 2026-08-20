import { buildConvergedSkillInstruction, resolveConvergedSkillBehaviour } from './skillBehaviourConvergence.js';
import { buildSkillBehaviourInstruction, type SkillBehaviourPack } from './skillBehaviourRegistry.js';
import { getCanonicalIdentityContext } from './memoryProfile.js';
import { getRepairIntakeQuestions, identifyDeviceFamily } from './deviceTaxonomyService.js';
import { buildSkillExecutionContract, buildSkillExecutionContractPrompt } from './skillExecutionContract.js';

const BIN_DAY: SkillBehaviourPack = {
  skill: 'bin_day', aliases: ['bin day', 'bin collection', 'rubbish collection', 'recycling collection', 'trash day'],
  mission: 'Resolve the user’s local waste-collection schedule and create or update a recurring reminder when requested.',
  required: ['postcode/address or council/local authority'],
  optional: ['bin type', 'collection time', 'reminder lead time', 'preferred reminder channel'],
  questionOrder: ['postcode/address or council/local authority', 'bin type', 'collection day', 'reminder timing'],
  validate: ['use an authoritative council/collection source when available', 'do not guess a collection day from postcode alone', 'distinguish collection streams', 're-check future holiday changes when the source exposes them'],
  matching: ['local authority', 'collection-zone source', 'source freshness'],
  capabilities: ['discovery', 'verification', 'evidence', 'completion'],
  completionEvidence: ['authoritative schedule/source', 'saved recurring reminder', 'notification schedule'],
  failureModes: ['postcode/council unresolved', 'source unavailable', 'schedule not published', 'notification unavailable'],
  instructions: [
    'Use Memory Profile location/country only to avoid repeat questions, never as proof of a live collection schedule.',
    'A new address in the current request wins over stored location and must not silently overwrite memory.',
    'Never create a reminder for a dynamic collection schedule until an authoritative collection date or recurring schedule has been established.',
    'Create the reminder through the canonical reminder service only after the schedule is established.',
    'Re-check future collection changes where the authoritative source exposes bank-holiday or service-change updates.',
    'If the source cannot be resolved, ask for the smallest missing locality detail.',
  ],
};

export function resolveRuntimeSkillBehaviour(text: string, hints: string[] = []): SkillBehaviourPack | null {
  const haystack = `${text} ${hints.join(' ')}`.toLowerCase();
  if (/\b(?:bin day|bin collection|rubbish collection|recycling collection|trash day)\b/i.test(haystack)) return BIN_DAY;
  return resolveConvergedSkillBehaviour(text, hints);
}

export async function buildRuntimeSkillInstruction(phone: string | undefined, text: string, hints: string[] = []): Promise<string> {
  const pack = resolveRuntimeSkillBehaviour(text, hints);
  if (!pack) return '';
  let memory = '';
  if (phone) {
    try {
      const ctx = await getCanonicalIdentityContext(phone, 'skill_behaviour_runtime');
      const relevant = ctx.stableFacts.filter(f => ['location', 'country', 'language', 'locale', 'timezone', 'preferred_channel', 'communication_style'].includes(f.field));
      const prefs = Object.entries(ctx.preferences).slice(0, 6).map(([k, v]) => `${k}=${String(v)}`);
      const values = [...relevant.map(f => `${f.field}=${f.value} (${f.provenance})`), ...prefs.map(x => `preference:${x}`)];
      if (values.length) memory = `\n--- Relevant Memory Profile context (never expose) ---\n${values.join('; ')}\n--- End Memory Profile context ---\n`;
    } catch {}
  }
  const contract = buildSkillExecutionContract(pack.skill);
  const contractInstruction = buildSkillExecutionContractPrompt(contract);
  if (BIN_DAY.skill === pack.skill) return `${buildSkillBehaviourInstruction(pack)}\n${contractInstruction}${memory}`;
  const repairSignal = /\b(?:repair|fix|broken|damaged|screen|battery|charging|no power|not working)\b/i.test(text);
  if (repairSignal) {
    const family = identifyDeviceFamily(text);
    const repairQuestions = getRepairIntakeQuestions(text);
    return `${buildConvergedSkillInstruction(phone, text, hints)}\n${contractInstruction}\n--- Device taxonomy guidance ---\n${family ? `Recognised family: ${family.manufacturer} ${family.domain}.` : 'Device family not yet resolved.'}\nAsk/confirm: ${repairQuestions.join('; ')}.\nNever infer exact part compatibility from brand alone.\n--- End device taxonomy guidance ---\n${memory}`;
  }
  return `${buildConvergedSkillInstruction(phone, text, hints)}\n${contractInstruction}${memory}`;
}
