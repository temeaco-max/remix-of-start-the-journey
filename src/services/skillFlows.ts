import { getDb } from '../database.js';

export interface SkillFlow {
    skill: string;
    question_set: string;
    post_match_action: string;
    payment_model: string;
    fulfillment_instructions: string;
}

export async function getSkillFlow(skill: string): Promise<SkillFlow | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM skill_flows WHERE skill = ?`);
    stmt.bind([skill]);
    let result: SkillFlow | null = null;
    if (stmt.step()) {
        result = stmt.getAsObject() as any;
    }
    stmt.free();
    return result;
}
