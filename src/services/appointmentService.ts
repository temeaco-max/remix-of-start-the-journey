/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';

export async function bookAppointment(phone: string, providerPhone: string, slotTime: string): Promise<number> {
    const db = await getDb();
    db.run(`INSERT INTO appointment_slots (client_phone, provider_phone, slot_time, status) VALUES (?, ?, ?, 'confirmed')`, [phone, providerPhone, slotTime]);
    const res = db.exec(`SELECT last_insert_rowid() as id`);
    const id = res[0]?.values[0][0] || 1;
    saveDb();
    return id;
}
