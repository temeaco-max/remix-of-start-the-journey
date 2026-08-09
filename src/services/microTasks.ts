import { getDb, saveDb } from '../database.js';
import { addCredits, addPoints } from './pointsEngine.js';

export async function getAvailableTasks(phone: string) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM micro_tasks WHERE status = 'available'`);
    const tasks = [];
    while (stmt.step()) tasks.push(stmt.getAsObject());
    stmt.free();
    return tasks;
}

export async function acceptTask(phone: string, taskId: number) {
    const db = await getDb();
    db.run(`UPDATE micro_tasks SET status = 'in_progress', assigned_to = ? WHERE id = ? AND status = 'available'`, [phone, taskId]);
    saveDb();
    return true;
}

export async function completeTask(phone: string, taskId: number, result: string) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT credits_reward FROM micro_tasks WHERE id = ? AND assigned_to = ? AND status = 'in_progress'`);
    stmt.bind([taskId, phone]);
    let reward = 0;
    if (stmt.step()) {
        reward = stmt.getAsObject().credits_reward as number;
    }
    stmt.free();

    if (reward > 0) {
        db.run(`UPDATE micro_tasks SET status = 'completed' WHERE id = ?`, [taskId]);
        await addCredits(phone, reward, `Completed micro-task #${taskId}`);
        saveDb();
        return { success: true, reward };
    }
    return { success: false };
}
