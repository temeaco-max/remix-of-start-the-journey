/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';

async function ensureBlueprintTables() {
    const db = await getDb();
    db.run(`
        CREATE TABLE IF NOT EXISTS leagues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sport TEXT NOT NULL,
            location TEXT,
            organizer_phone TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            league_id INTEGER,
            name TEXT NOT NULL,
            captain_phone TEXT,
            location TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS league_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER,
            phone TEXT NOT NULL,
            role TEXT DEFAULT 'player',
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, phone)
        );
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            league_id INTEGER,
            home_team_id INTEGER,
            away_team_id INTEGER,
            scheduled_at TEXT,
            venue TEXT,
            status TEXT DEFAULT 'scheduled',
            home_score INTEGER,
            away_score INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS event_coverage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            location TEXT,
            contributor_phone TEXT,
            assignment_type TEXT,
            status TEXT DEFAULT 'offered',
            rate_minor INTEGER DEFAULT 500,
            rights_accepted INTEGER DEFAULT 0,
            checked_in_at TEXT,
            approved_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS how_to_scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            topic TEXT NOT NULL,
            script TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS video_subscription_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_hash TEXT,
            platform TEXT,
            event_type TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);
    saveDb();
}

export function buildUniversalOrderCard(query: string) {
    const q = query.toLowerCase();
    let category = 'general';
    if (/suya|akara|rice|food|bread|meal|yam|cater/.test(q)) category = 'food';
    else if (/grocery|groceries|provisions|market/.test(q)) category = 'groceries';
    else if (/car part|brake|tyre|tire|battery|spark plug|engine part/.test(q)) category = 'car_parts';
    else if (/cloth|clothing|shirt|shoe|fashion|equipment/.test(q)) category = 'catalog';

    return {
        type: 'agentic_order_flow',
        category,
        stages: ['intent_extraction', 'memory_lookup', 'catalog_worker_match', 'escrow_lock', 'multi_leg_dispatch', 'completion'],
        nextAction: 'confirm_item_quantity_location',
        message: `I can handle this end-to-end: find the right vendor, confirm the item and quantity, lock payment in escrow, and arrange delivery where needed.`
    };
}

export async function createLeague(name: string, sport: string, location: string | undefined, organizerPhone: string) {
    await ensureBlueprintTables();
    const db = await getDb();
    db.run('INSERT INTO leagues (name, sport, location, organizer_phone, status) VALUES (?, ?, ?, ?, ?)', [name, sport, location || null, organizerPhone, 'open']);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    saveDb();
    return Number(result[0]?.values?.[0]?.[0] || 0);
}

export async function createTeam(leagueId: number, name: string, captainPhone: string, location?: string) {
    await ensureBlueprintTables();
    const db = await getDb();
    db.run('INSERT INTO teams (league_id, name, captain_phone, location) VALUES (?, ?, ?, ?)', [leagueId, name, captainPhone, location || null]);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    saveDb();
    return Number(result[0]?.values?.[0]?.[0] || 0);
}

export async function joinTeam(teamId: number, phone: string, role = 'player') {
    await ensureBlueprintTables();
    const db = await getDb();
    db.run('INSERT OR IGNORE INTO league_members (team_id, phone, role) VALUES (?, ?, ?)', [teamId, phone, role]);
    saveDb();
}

export async function createEventCoverageAssignment(eventName: string, location: string | undefined, contributorPhone: string, assignmentType = 'clip', rateMinor = 500) {
    await ensureBlueprintTables();
    const db = await getDb();
    db.run('INSERT INTO event_coverage (event_name, location, contributor_phone, assignment_type, rate_minor) VALUES (?, ?, ?, ?, ?)', [eventName, location || null, contributorPhone, assignmentType, rateMinor]);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    saveDb();
    return Number(result[0]?.values?.[0]?.[0] || 0);
}

export async function acceptEventCoverage(id: number, contributorPhone: string) {
    await ensureBlueprintTables();
    const db = await getDb();
    db.run("UPDATE event_coverage SET status = 'accepted' WHERE id = ? AND contributor_phone = ? AND status = 'offered'", [id, contributorPhone]);
    saveDb();
}

export async function generateHowToScript(title: string, topic: string) {
    await ensureBlueprintTables();
    const script = `Hook: ${title}\n\n1. Explain the problem: ${topic}.\n2. Show the safest/simple first step.\n3. Demonstrate the next step with the relevant Kurukoo action.\n4. Confirm the expected result.\n5. Close with: Wake up. Get going.`;
    const db = await getDb();
    db.run('INSERT INTO how_to_scripts (title, topic, script, status) VALUES (?, ?, ?, ?)', [title, topic, script, 'draft']);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    saveDb();
    return { id: Number(result[0]?.values?.[0]?.[0] || 0), title, topic, script };
}
