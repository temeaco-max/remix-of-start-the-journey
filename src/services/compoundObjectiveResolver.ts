/**
 * Compound objective recognition and decomposition.
 *
 * A compound objective expresses multiple sub-objectives with an explicit
 * dependency relationship (e.g. "Fix my laptop and sell it when it's ready").
 * The resolver recognises these patterns deterministically — it never invents
 * providers, prices, availability, payment or completion.
 *
 * The resolver is a language-understanding layer only; canonical services
 * remain the sole authority for goal creation, dependency attachment,
 * Economic Request lifecycle, confirmation policy, evidence and notifications.
 */

/** Deterministic conjunction patterns that indicate a compound objective. */
const COMPOUND_CONJUNCTIONS = [
  /\b(.+?)\s+and\s+(.+?)\s+when\s+(.+?)(?:[.!?]|$)/i,
  /\b(.+?)\s*,?\s*and\s+then\s+(.+?)(?:[.!?]|$)/i,
  /^\s*(.+?)\s*,?\s*then\s+(.+?)(?:[.!?]|$)/i,
  /\b(.+?)\s*,?\s*after\s+(.+?)(?:[.!?]|$)/i,
];

function inferSkill(text: string): string {
  const lower = text.toLowerCase();
  if (/laptop|macbook|computer|pc\b/.test(lower)) return 'phone_repairer';
  if (/phone|iphone|android|screen/.test(lower)) return 'phone_repairer';
  if (/sell|market|advertise|list.*for sale/.test(lower)) return 'find_worker';
  if (/clean|tidy/.test(lower)) return 'house_cleaner';
  if (/plumb|leak|pipe|tap|faucet/.test(lower)) return 'plumber';
  if (/electric|wiring|socket|light/.test(lower)) return 'electrician';
  if (/paint|decorat/.test(lower)) return 'painter';
  if (/car|vehicle|engine|brake/.test(lower)) return 'mechanic';
  if (/bike|bicycle/.test(lower)) return 'mechanic';
  return 'find_worker';
}

export interface CompoundSubObjective { skill: string; objective: string; dependsOn?: number }
export interface CompoundDecomposition { parentObjective: string; subObjectives: CompoundSubObjective[] }

export function recognizeCompoundObjective(text: string): CompoundDecomposition | null {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length < 10) return null;
  const lower = trimmed.toLowerCase();
  for (const pattern of COMPOUND_CONJUNCTIONS) {
    const match = pattern.exec(lower);
    if (!match) continue;
    const first = match[1].trim();
    const second = match[2].trim();
    if (!first || !second || first.split(/\s+/).length < 2 || second.split(/\s+/).length < 2) continue;
    const firstVerb = first.split(/\s+/)[0];
    const secondVerb = second.split(/\s+/)[0];
    if (firstVerb === secondVerb && first === second) continue;
    const subObjectives: CompoundSubObjective[] = [
      { skill: inferSkill(first), objective: first },
      { skill: inferSkill(second), objective: second, dependsOn: 0 },
    ];
    return { parentObjective: trimmed, subObjectives };
  }
  return null;
}

export function resolveSubGoalSkill(subObjectiveText: string): string {
  return inferSkill(subObjectiveText);
}
