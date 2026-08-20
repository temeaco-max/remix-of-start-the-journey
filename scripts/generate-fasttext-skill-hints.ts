import fs from 'node:fs';
import path from 'node:path';
import { getAllConvergedSkillNames, getConvergedSkillBehaviour } from '../src/services/skillBehaviourConvergence.js';

const output = path.join(process.cwd(), 'models', 'intent_training_skill_hints.txt');
fs.mkdirSync(path.dirname(output), { recursive: true });

const examples = new Set<string>();
for (const skill of getAllConvergedSkillNames()) {
  const pack = getConvergedSkillBehaviour(skill);
  const label = `__label__skill_route_${skill.replace(/[^a-z0-9_]+/gi, '_')}`;
  const aliases = Array.from(new Set([skill.replace(/_/g, ' '), ...pack.aliases])).filter(Boolean);
  for (const alias of aliases.slice(0, 8)) {
    const clean = alias.replace(/\s+/g, ' ').trim();
    examples.add(`${label} ${clean}`);
    examples.add(`${label} i need ${clean}`);
    examples.add(`${label} can you help with ${clean}`);
    examples.add(`${label} find a ${clean}`);
  }
}
fs.writeFileSync(output, `${Array.from(examples).sort().join('\n')}\n`, 'utf8');
console.log(`[FastText] generated ${examples.size} skill-hint examples for ${getAllConvergedSkillNames().length} skills: ${output}`);
