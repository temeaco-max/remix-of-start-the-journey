import { getDb } from '../database.js';

export interface SkillFlow {
    skill: string;
    question_set: string;
    post_match_action: string;
    payment_model: string;
    fulfillment_instructions: string;
}

function normalize(row: any): SkillFlow | null {
    if (!row) return null;
    const flow = {
        skill: String(row.skill || '').trim(),
        question_set: String(row.question_set || '').trim(),
        post_match_action: String(row.post_match_action || '').trim(),
        payment_model: String(row.payment_model || '').trim(),
        fulfillment_instructions: String(row.fulfillment_instructions || '').trim()
    };
    return flow.skill ? flow : null;
}

export async function getSkillFlow(skill: string): Promise<SkillFlow | null> {
    const name = skill.trim();
    if (!name) return null;
    const db = await getDb();
    const stmt = db.prepare(`SELECT skill, question_set, post_match_action, payment_model, fulfillment_instructions FROM skill_flows WHERE skill = ? LIMIT 1`);
    stmt.bind([name]);
    const result = stmt.step() ? normalize(stmt.getAsObject()) : null;
    stmt.free();
    return result;
}

export async function auditSkillFlows(): Promise<{ total: number; valid: number; invalid: string[] }> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT skill, question_set, post_match_action, payment_model, fulfillment_instructions FROM skill_flows ORDER BY skill`);
    const invalid: string[] = [];
    let total = 0;
    let valid = 0;
    while (stmt.step()) {
        total += 1;
        const flow = normalize(stmt.getAsObject());
        if (!flow || !flow.question_set || !flow.post_match_action || !flow.payment_model || !flow.fulfillment_instructions) {
            invalid.push(flow?.skill || String((stmt.getAsObject() as any).skill || 'unknown'));
        } else valid += 1;
    }
    stmt.free();
    return { total, valid, invalid };
}
