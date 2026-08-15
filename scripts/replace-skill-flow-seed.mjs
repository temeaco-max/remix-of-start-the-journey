import fs from 'node:fs';
const path = 'src/services/skillFlows.ts';
const source = fs.readFileSync(path, 'utf8');
const start = source.indexOf('function seedCanonicalSkillFlows');
const end = source.indexOf('\nexport async function getSkillFlow', start);
if (start < 0 || end < 0) throw new Error('skill flow seed boundaries not found');
const replacement = `function seedCanonicalSkillFlows(db:any):void{for(const [skill,definition] of Object.entries(EXPLICIT_SKILL_FLOW_DEFINITIONS)){db.run(\`INSERT INTO skill_flows(skill,question_set,post_match_action,payment_model,fulfillment_instructions,flow_mode) VALUES(?,?,?,?,?,?) ON CONFLICT(skill) DO UPDATE SET question_set=excluded.question_set,post_match_action=excluded.post_match_action,payment_model=excluded.payment_model,fulfillment_instructions=excluded.fulfillment_instructions,flow_mode=excluded.flow_mode\`,[skill,JSON.stringify(definition.questions),definition.action,definition.payment,definition.fulfillment,definition.mode]);}}`;
fs.writeFileSync(path, `${source.slice(0, start)}${replacement}${source.slice(end)}`);
console.log('Replaced canonical skill-flow seed with explicit catalogue seeding');
