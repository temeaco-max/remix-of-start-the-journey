import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/kurukoo.db');

let db: any;
let SQL: any;

export async function getDb() {
    if (db) return db;
    SQL = await initSqlJs({ locateFile: (file: string) => path.join(__dirname, '../node_modules/sql.js/dist', file) });
    if (fs.existsSync(dbPath)) db = new SQL.Database(fs.readFileSync(dbPath));
    else db = new SQL.Database();
    initSchema(db);
    return db;
}

export function saveDb() {
    if (!db) return;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function initSchema(database: any) {
    database.run(`
        CREATE TABLE IF NOT EXISTS memory_profiles (
            phone TEXT PRIMARY KEY,
            name TEXT,
            location TEXT,
            points INTEGER DEFAULT 0,
            subscription_tier TEXT DEFAULT 'free',
            preferences TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS escrow (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            booking_type TEXT,
            payer_phone TEXT,
            payee_phone TEXT,
            amount INTEGER,
            description TEXT,
            status TEXT DEFAULT 'held',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            cooling_off_until TEXT,
            completed_at TEXT,
            dispute_reason TEXT
        );
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            phone TEXT,
            order_type TEXT,
            provider_phone TEXT,
            amount INTEGER,
            status TEXT,
            idempotency_key TEXT UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            requirements_json TEXT DEFAULT '{}',
            capabilities_json TEXT DEFAULT '[]',
            provider_status TEXT DEFAULT 'unmatched',
            quote_json TEXT,
            fulfillment_json TEXT
        );
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            skill TEXT,
            source TEXT DEFAULT 'explicit',
            confidence REAL DEFAULT 1.0,
            is_available INTEGER DEFAULT 1,
            operation_mode TEXT DEFAULT 'stationary',
            hourly_rate REAL DEFAULT 0,
            rating REAL DEFAULT 5.0,
            jobs_completed INTEGER DEFAULT 0,
            equipment TEXT,
            availability_schedule TEXT,
            service_radius_km REAL DEFAULT 10,
            transport_mode TEXT,
            pricing_model TEXT,
            payment_method TEXT,
            booking_mode TEXT DEFAULT 'instant',
            products TEXT,
            verified_artist INTEGER DEFAULT 0,
            FOREIGN KEY(phone) REFERENCES memory_profiles(phone)
        );
        CREATE TABLE IF NOT EXISTS skill_flows (
            skill TEXT PRIMARY KEY,
            question_set TEXT,
            post_match_action TEXT,
            payment_model TEXT,
            fulfillment_instructions TEXT,
            available_locales TEXT DEFAULT '["en"]'
        );
    `);

    // Non-destructive migrations for existing deployments.
    const columns = (table: string) => {
        const result = database.exec(`PRAGMA table_info(${table})`);
        return result?.[0]?.values?.map((col: any[]) => String(col[1])) || [];
    };
    const orderColumns = columns('orders');
    if (!orderColumns.includes('category')) database.run("ALTER TABLE orders ADD COLUMN category TEXT");
    if (!orderColumns.includes('requirements_json')) database.run("ALTER TABLE orders ADD COLUMN requirements_json TEXT DEFAULT '{}'");
    if (!orderColumns.includes('capabilities_json')) database.run("ALTER TABLE orders ADD COLUMN capabilities_json TEXT DEFAULT '[]'");
    if (!orderColumns.includes('provider_status')) database.run("ALTER TABLE orders ADD COLUMN provider_status TEXT DEFAULT 'unmatched'");
    if (!orderColumns.includes('quote_json')) database.run("ALTER TABLE orders ADD COLUMN quote_json TEXT");
    if (!orderColumns.includes('fulfillment_json')) database.run("ALTER TABLE orders ADD COLUMN fulfillment_json TEXT");
}

export async function createEconomicOrder(input: {
    id: string;
    phone: string;
    skill: string;
    category: string;
    requirements: Record<string, unknown>;
    capabilities: string[];
    amount?: number;
}) {
    const database = await getDb();
    const stmt = database.prepare(`
        INSERT INTO orders (id, phone, order_type, amount, status, category, requirements_json, capabilities_json, provider_status)
        VALUES (?, ?, ?, ?, 'requested', ?, ?, ?, 'unmatched')
    `);
    stmt.bind([
        input.id,
        input.phone,
        input.skill,
        Number.isFinite(input.amount) ? input.amount : 0,
        input.category,
        JSON.stringify(input.requirements || {}),
        JSON.stringify(input.capabilities || [])
    ]);
    stmt.step();
    stmt.free();
    saveDb();
    return input.id;
}

export async function getEconomicOrder(id: string) {
    const database = await getDb();
    const stmt = database.prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`);
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    if (!result) return null;
    return {
        ...result,
        requirements: JSON.parse(String(result.requirements_json || '{}')),
        capabilities: JSON.parse(String(result.capabilities_json || '[]')),
        quote: result.quote_json ? JSON.parse(String(result.quote_json)) : null,
        fulfillment: result.fulfillment_json ? JSON.parse(String(result.fulfillment_json)) : null
    };
}

export async function transitionEconomicOrder(id: string, status: string, patch: Record<string, unknown> = {}) {
    const database = await getDb();
    const current = await getEconomicOrder(id);
    if (!current) throw new Error('Economic request not found');
    const allowed: Record<string, string[]> = {
        requested: ['awaiting_match', 'abandoned'],
        awaiting_match: ['partially_matched', 'fulfilled', 'abandoned'],
        partially_matched: ['fulfilled', 'abandoned'],
        fulfilled: [],
        abandoned: []
    };
    if (status !== current.status && !allowed[String(current.status)]?.includes(status)) throw new Error(`Invalid economic request transition: ${current.status} -> ${status}`);
    const stmt = database.prepare(`UPDATE orders SET status = ?, provider_phone = COALESCE(?, provider_phone), provider_status = COALESCE(?, provider_status), quote_json = COALESCE(?, quote_json), fulfillment_json = COALESCE(?, fulfillment_json) WHERE id = ?`);
    stmt.bind([
        status,
        patch.provider_phone ?? null,
        patch.provider_status ?? null,
        patch.quote ? JSON.stringify(patch.quote) : null,
        patch.fulfillment ? JSON.stringify(patch.fulfillment) : null,
        id
    ]);
    stmt.step();
    stmt.free();
    saveDb();
    return getEconomicOrder(id);
}
