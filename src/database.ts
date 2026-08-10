import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any = null;
const dbFilePath = process.env.DB_PATH || path.join(process.cwd(), 'kurukoo.sqlite');

export async function getDb() {
    if (db) return db;
    const SQL = await initSqlJs();
    if (fs.existsSync(dbFilePath)) {
        const fileBuffer = fs.readFileSync(dbFilePath);
        db = new SQL.Database(fileBuffer);
        initTables(db);
        auditAppointmentSkillFlows(db);
        saveDb();
    } else {
        db = new SQL.Database();
        initTables(db);
        seedSkillFlows(db);
        seedDemoProviders(db);
        seedNigerianProviders(db);
        auditAppointmentSkillFlows(db);
        saveDb();
        console.log("Kurukoo database seeded.");
    }
    return db;
}

let saveTimer: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = Math.max(50, Number(process.env.KURUKOO_DB_SAVE_DEBOUNCE_MS || 250));

function flushDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(dbFilePath, Buffer.from(data));
}

export function saveDb(immediate = false) {
    if (!db) return;
    if (immediate) {
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        flushDb();
        return;
    }
    if (saveTimer) return;
    saveTimer = setTimeout(() => { saveTimer = null; flushDb(); }, SAVE_DEBOUNCE_MS);
}

process.once('beforeExit', () => flushDb());

function initTables(database: any) {
    database.run(`
        CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS memory_profiles (
            phone TEXT PRIMARY KEY, name TEXT, email TEXT, location TEXT, primary_lga TEXT, primary_state TEXT,
            country TEXT DEFAULT 'ng', subscription_tier TEXT DEFAULT 'Base', points_balance INTEGER DEFAULT 30,
            wallet_balance_minor INTEGER DEFAULT 30, currency TEXT DEFAULT 'NGN', preferences TEXT,
            behavior_patterns TEXT, inferred_roles TEXT, grace_leads INTEGER DEFAULT 0, fcm_token TEXT,
            is_available INTEGER DEFAULT 0, is_contributor INTEGER DEFAULT 0, nin TEXT, verified_provider INTEGER DEFAULT 0,
            livecast_signals_remaining INTEGER DEFAULT 30, trust_score REAL DEFAULT 5.0, last_active_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS profile_access_log (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, service_name TEXT, action TEXT, timestamp TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS keep_alive_analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, event_type TEXT, cost_impact REAL DEFAULT 0.0, metadata TEXT, timestamp TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS temp_sessions (sessionId TEXT PRIMARY KEY, location TEXT, interactions TEXT, preferences TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, skill TEXT, source TEXT DEFAULT 'explicit', confidence REAL DEFAULT 1.0, is_available INTEGER DEFAULT 1, operation_mode TEXT DEFAULT 'stationary', hourly_rate REAL DEFAULT 0, rating REAL DEFAULT 5.0, jobs_completed INTEGER DEFAULT 0, equipment TEXT, availability_schedule TEXT, service_radius_km REAL DEFAULT 10, transport_mode TEXT, pricing_model TEXT, payment_method TEXT, booking_mode TEXT DEFAULT 'instant', products TEXT, verified_artist INTEGER DEFAULT 0, FOREIGN KEY(phone) REFERENCES memory_profiles(phone));
        CREATE TABLE IF NOT EXISTS skill_flows (skill TEXT PRIMARY KEY, question_set TEXT, post_match_action TEXT, payment_model TEXT, fulfillment_instructions TEXT, available_locales TEXT DEFAULT '["en"]');
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, sender TEXT, content TEXT, channel TEXT DEFAULT 'pwa', card_data TEXT, status TEXT DEFAULT 'sent', whatsapp_msg_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS credit_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, amount INTEGER, type TEXT, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS pulse_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, skill TEXT, lat REAL, lng REAL, expires_at TEXT, active INTEGER DEFAULT 1);
        CREATE TABLE IF NOT EXISTS provider_presence (phone TEXT PRIMARY KEY, is_live INTEGER DEFAULT 0, operation_mode TEXT DEFAULT 'stationary', last_lat REAL, last_lng REAL, fuzzed_radius_m INTEGER DEFAULT 100, live_until TEXT, last_confirmed TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(phone) REFERENCES memory_profiles(phone));
        CREATE TABLE IF NOT EXISTS user_behavior_signals (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, signal_type TEXT, key TEXT, value TEXT, strength REAL DEFAULT 0.5, last_seen TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(phone) REFERENCES memory_profiles(phone));
        CREATE TABLE IF NOT EXISTS escrow (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, buyer_phone TEXT, provider_phone TEXT, amount_minor INTEGER, description TEXT, status TEXT DEFAULT 'held', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS disputes (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, order_id TEXT, reason TEXT, status TEXT DEFAULT 'open', resolution TEXT, type TEXT DEFAULT 'dispute', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS content (slug TEXT PRIMARY KEY, title TEXT, body TEXT, type TEXT, author TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS money_circles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, creator_phone TEXT, target_amount REAL, status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS circle_members (id INTEGER PRIMARY KEY AUTOINCREMENT, circle_id INTEGER, phone TEXT, role TEXT DEFAULT 'member');
        CREATE TABLE IF NOT EXISTS circle_contributions (id INTEGER PRIMARY KEY AUTOINCREMENT, circle_id INTEGER, phone TEXT, amount REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS emergency_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, country TEXT, name TEXT, phone TEXT);
        CREATE TABLE IF NOT EXISTS survey_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, options TEXT);
        CREATE TABLE IF NOT EXISTS survey_inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT);
        CREATE TABLE IF NOT EXISTS livecast_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, lat REAL, lng REAL);
        CREATE TABLE IF NOT EXISTS processed_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, tx_ref TEXT UNIQUE);
        CREATE TABLE IF NOT EXISTS referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_phone TEXT, referred_phone TEXT, rewarded INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS unknown_intents (id INTEGER PRIMARY KEY AUTOINCREMENT, query TEXT);
        CREATE TABLE IF NOT EXISTS sent_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, question TEXT);
        CREATE TABLE IF NOT EXISTS compliance_events (id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT);
        CREATE TABLE IF NOT EXISTS community_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT, content TEXT);
        CREATE TABLE IF NOT EXISTS price_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT, price REAL);
        CREATE TABLE IF NOT EXISTS classifieds (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, price REAL);
        CREATE TABLE IF NOT EXISTS appointment_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, client_phone TEXT, provider_phone TEXT, slot_time TEXT, status TEXT);
        CREATE TABLE IF NOT EXISTS affiliate_clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, product TEXT);
        CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, phone TEXT, order_type TEXT, provider_phone TEXT, amount INTEGER, status TEXT, idempotency_key TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS ad_campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, desc TEXT, image_url TEXT, target_keyword TEXT, credits_budget INTEGER, credits_spent INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS email_log (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient TEXT, subject TEXT, body TEXT, status TEXT, sent_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS future_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, phase TEXT, status TEXT);
        CREATE TABLE IF NOT EXISTS ai_agents (id TEXT PRIMARY KEY, name TEXT, system_prompt TEXT, skills TEXT, tools TEXT, status TEXT DEFAULT 'active', lga TEXT, concurrency_limit INTEGER DEFAULT 5, token_quota_daily INTEGER DEFAULT 10000, cost_threshold_usd REAL DEFAULT 1.0, temperature REAL DEFAULT 0.2, tokens_used_today INTEGER DEFAULT 0, success_count INTEGER DEFAULT 0, escalation_count INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS scam_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_phone TEXT, reported_phone TEXT, description TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS social_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT, content TEXT, scheduled_time TEXT, status TEXT DEFAULT 'pending');
        CREATE TABLE IF NOT EXISTS partnerships (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT, contact TEXT, status TEXT, next_action TEXT, due_date TEXT, notes TEXT);
        CREATE TABLE IF NOT EXISTS micro_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, skill_tag TEXT, credits_reward INTEGER, status TEXT DEFAULT 'available', assigned_to TEXT);
        CREATE TABLE IF NOT EXISTS service_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, options TEXT);
        CREATE TABLE IF NOT EXISTS success_stories (id INTEGER PRIMARY KEY AUTOINCREMENT, story_text TEXT, category TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, used INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS badges (phone TEXT, badge_type TEXT, awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (phone, badge_type));
        CREATE TABLE IF NOT EXISTS celebrity_demand (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, category TEXT, interested_users INTEGER DEFAULT 0, threshold INTEGER DEFAULT 5000, status TEXT DEFAULT 'tracking', report_generated INTEGER DEFAULT 0, contacted INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS provider_leaderboard (phone TEXT PRIMARY KEY, skill TEXT, monthly_jobs INTEGER DEFAULT 0, monthly_rating REAL DEFAULT 0.0, rank INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS pricing (plan TEXT, country TEXT, monthly_price_minor INTEGER, currency TEXT, credits_per_month INTEGER, features TEXT, active INTEGER DEFAULT 1, PRIMARY KEY (plan, country));
        CREATE TABLE IF NOT EXISTS provider_subscriptions (phone TEXT PRIMARY KEY, tier TEXT NOT NULL, status TEXT NOT NULL, next_billing_date TEXT NOT NULL, leads_this_month INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS commission_config (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT UNIQUE, rate_minor INTEGER, description TEXT, active INTEGER DEFAULT 1);
    `);

    const addColumns = (table: string, additions: Record<string, string>) => {
        const result = database.exec(`PRAGMA table_info(${table})`);
        const cols = result?.[0]?.values?.map((col: any[]) => String(col[1])) || [];
        for (const [name, definition] of Object.entries(additions)) if (!cols.includes(name)) database.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    };
    addColumns('memory_profiles', { email: 'TEXT', primary_lga: 'TEXT', primary_state: 'TEXT', points_balance: 'INTEGER DEFAULT 30', livecast_signals_remaining: 'INTEGER DEFAULT 30', trust_score: 'REAL DEFAULT 5.0', last_active_at: 'TEXT', full_name: 'TEXT', sso_provider: 'TEXT', sso_provider_id: 'TEXT', email_verified_at: 'TEXT', display_name: 'TEXT', subscription_expiry: 'TEXT', available_for_work: 'INTEGER DEFAULT 0' });
    addColumns('escrow', { booking_type: 'TEXT', cooling_off_until: 'TEXT', completed_at: 'TEXT', dispute_reason: 'TEXT' });
    addColumns('referrals', { status: "TEXT DEFAULT 'pending'", referral_code: 'TEXT', created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP' });
    addColumns('skills', { verified_artist: 'INTEGER DEFAULT 0' });
    addColumns('ai_agents', { avatar: "TEXT DEFAULT '🤖'" });
    addColumns('messages', { status: "TEXT DEFAULT 'sent'", whatsapp_msg_id: 'TEXT' });
    addColumns('orders', {
        category: 'TEXT',
        requirements_json: "TEXT DEFAULT '{}'",
        capabilities_json: "TEXT DEFAULT '[]'",
        provider_status: "TEXT DEFAULT 'unmatched'",
        quote_json: 'TEXT',
        fulfillment_json: 'TEXT'
    });
    database.run("CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone)");
    database.run("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)");
    database.run("CREATE INDEX IF NOT EXISTS idx_orders_phone_status ON orders(phone, status)");

    const emergency = [['ng', 'Police Emergency', '112'], ['ng', 'Federal Road Safety (FRSC)', '122'], ['ng', 'Lagos State Emergency (LASEMA)', '767']];
    for (const e of emergency) database.run(`INSERT OR IGNORE INTO emergency_contacts (country, name, phone) VALUES (?, ?, ?)`, e);
}

function seedSkillFlows(database: any) {
    const seeds = [
        ['rider', [{ q: 'What is your pickup location?', options: [] }, { q: 'What is your dropoff location?', options: [] }], 'lead', 'credits', 'Find nearest active riders'],
        ['plumber', [{ q: 'What plumbing issue are you facing?', options: ['Leaking pipe', 'Blocked drain', 'Toilet repair', 'Other'] }], 'lead', 'credits', 'Match with local plumber'],
        ['electrician', [{ q: 'Describe the electrical job', options: ['Wiring', 'Fixture install', 'Fault finding', 'Other'] }], 'lead', 'credits', 'Match with electrician'],
        ['mechanic', [{ q: 'What is the vehicle issue?', options: ['Engine', 'Brakes', 'Oil change', 'Battery', 'Not starting'] }], 'lead', 'credits', 'Match vehicle mechanic'],
        ['phone_repair', [{ q: 'Select your phone issue', options: ['Screen replacement', 'Battery change', 'Charging port', 'Software'] }], 'lead', 'credits', 'Match mobile repair technician'],
        ['food_nearby', [{ q: 'Postcode and cuisine', options: [] }], 'affiliate', 'credits', 'List nearby food providers'],
        ['dispatch_rider', [{ q: 'What item needs dispatching?', options: ['Food', 'E-commerce package', 'Documents'] }], 'lead', 'credits', 'Match active dispatch rider'],
        ['doctor_appointment', [{ q: 'What type of appointment do you need?', options: ['General', 'Specialist', 'Follow-up'] }], 'appointment', 'credits', 'Schedule with an appropriate provider'],
        ['verified_artist', [{ q: 'What event are you planning?', options: ['Wedding', 'Corporate', 'Concert', 'Private event'] }, { q: 'Event date and venue', options: [] }, { q: 'Approximate budget', options: [] }], 'booking', 'escrow', 'Match verified talent/representative'],
        ['event_mc', [{ q: 'What type of event?', options: ['Wedding', 'Corporate', 'Concert', 'Private party'] }], 'booking', 'escrow', 'Match event MC'],
        ['dj', [{ q: 'What type of event?', options: ['Wedding', 'Corporate', 'Club', 'Private party'] }], 'booking', 'escrow', 'Match event DJ'],
        ['buy_car', [{ q: 'Make, model, year and budget', options: [] }], 'listing', 'escrow', 'Match verified vehicle sellers and inspection options'],
        ['buy_ticket', [{ q: 'Which event, date, quantity and seating preference?', options: [] }], 'reservation', 'payment', 'Check real inventory and reserve only after provider confirmation'],
        ['order_food', [{ q: 'What would you like to order, and how many?', options: [] }, { q: 'Delivery location', options: [] }], 'order', 'payment', 'Match catalog vendor, confirm inventory, then dispatch if needed'],
        ['keke_driver', [{ q: 'Pickup and destination', options: [] }, { q: 'When?', options: ['Now', 'Later'] }], 'ride', 'payment', 'Match available keke provider'],
        ['okada_rider', [{ q: 'Pickup and destination', options: [] }, { q: 'When?', options: ['Now', 'Later'] }], 'ride', 'payment', 'Match available rider'],
        ['repair', [{ q: 'What needs fixing?', options: [] }, { q: 'Where are you?', options: [] }, { q: 'How urgent is it?', options: ['Now', 'Today', 'Flexible'] }], 'lead', 'quote', 'Match the appropriate repair provider'],
        ['find_worker', [{ q: 'What work do you need done?', options: [] }, { q: 'Where?', options: [] }, { q: 'When?', options: [] }], 'lead', 'quote', 'Match by skill, presence, availability and trust'],
        ['emergency', [{ q: 'What is happening and where?', options: [] }], 'dispatch', 'none', 'Provide verified emergency contacts and escalate to appropriate services'],
        ['product_sourcing', [{ q: 'What product, quantity and budget?', options: [] }, { q: 'Delivery location', options: [] }], 'order', 'escrow', 'Source from verified catalog providers and confirm inventory'],
        ['security_personnel', [{ q: 'What protection/service is needed?', options: [] }, { q: 'Location, date and duration', options: [] }, { q: 'Vetting level required?', options: ['Standard', 'Enhanced'] }], 'booking', 'escrow', 'Match licensed/verified security providers'],
        ['sports_coach', [{ q: 'Sport, level and schedule', options: [] }], 'booking', 'payment', 'Match sports provider'],
        ['football_club_founder', [{ q: 'Club location, age group and objective', options: [] }], 'community', 'payment', 'Coordinate club formation and member onboarding']
    ];
    for (const [skill, q, action, payment, fulfillment] of seeds) database.run(`INSERT OR IGNORE INTO skill_flows (skill, question_set, post_match_action, payment_model, fulfillment_instructions) VALUES (?, ?, ?, ?, ?)`, [skill, JSON.stringify(q), action, payment, fulfillment]);
}

export function seedDemoProviders(database: any) {}
export function seedNigerianProviders(database: any) {}
export function auditAppointmentSkillFlows(database: any) { return 0; }

export async function searchUserMessages(phone: string, keyword: string): Promise<any[]> {
    const database = await getDb();
    const stmt = database.prepare(`SELECT * FROM messages WHERE phone = ? AND content LIKE ? ORDER BY id DESC`);
    stmt.bind([phone, `%${keyword}%`]);
    const results: any[] = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}
export async function searchMessagesByKeyword(phone: string, keyword: string): Promise<any[]> { return searchUserMessages(phone, keyword); }

export async function purgeExpiredData(): Promise<{ messagesDeleted: number; tempSessionsDeleted: number; pulseLocationsDeleted: number }> {
    const database = await getDb();
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM messages WHERE created_at < ?`, [twelveMonthsAgo]); const messagesDeleted = database.getRowsModified();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM temp_sessions WHERE created_at < ?`, [sevenDaysAgo]); const tempSessionsDeleted = database.getRowsModified();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM pulse_sessions WHERE expires_at < ?`, [thirtyDaysAgo]); const pulseLocationsDeleted = database.getRowsModified();
    try { database.run(`DELETE FROM provider_presence WHERE updated_at < ? AND is_live = 0`, [thirtyDaysAgo]); } catch {}
    try { database.run(`DELETE FROM audit_logs WHERE created_at < ?`, [thirtyDaysAgo]); } catch {}
    saveDb();
    return { messagesDeleted, tempSessionsDeleted, pulseLocationsDeleted };
}

export async function updateProviderPresence(presence: { phone: string; is_live?: boolean | number; operation_mode?: string; last_lat?: number; last_lng?: number; fuzzed_radius_m?: number; live_until?: string }): Promise<void> {
    const database = await getDb(); const isLive = presence.is_live ? 1 : 0; const now = new Date().toISOString();
    const existingStmt = database.prepare("SELECT phone FROM provider_presence WHERE phone = ?"); existingStmt.bind([presence.phone]); const exists = existingStmt.step(); existingStmt.free();
    if (exists) database.run(`UPDATE provider_presence SET is_live=COALESCE(?,is_live), operation_mode=COALESCE(?,operation_mode), last_lat=COALESCE(?,last_lat), last_lng=COALESCE(?,last_lng), fuzzed_radius_m=COALESCE(?,fuzzed_radius_m), live_until=COALESCE(?,live_until), last_confirmed=?, updated_at=? WHERE phone=?`, [presence.is_live !== undefined ? isLive : null, presence.operation_mode || null, presence.last_lat ?? null, presence.last_lng ?? null, presence.fuzzed_radius_m ?? null, presence.live_until || null, now, now, presence.phone]);
    else database.run(`INSERT INTO provider_presence (phone,is_live,operation_mode,last_lat,last_lng,fuzzed_radius_m,live_until,last_confirmed,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, [presence.phone,isLive,presence.operation_mode||'stationary',presence.last_lat||null,presence.last_lng||null,presence.fuzzed_radius_m||100,presence.live_until||null,now,now]);
    saveDb();
}
export async function getProviderPresence(phone: string): Promise<any | null> { const database=await getDb(); const stmt=database.prepare("SELECT * FROM provider_presence WHERE phone=?"); stmt.bind([phone]); const result=stmt.step()?stmt.getAsObject():null; stmt.free(); return result; }
export async function recordBehaviorSignal(signal: { phone:string; signal_type:string; key:string; value:any; strength?:number }): Promise<void> { const database=await getDb(); const valueStr=typeof signal.value==='object'?JSON.stringify(signal.value):String(signal.value); const now=new Date().toISOString(); database.run(`INSERT INTO user_behavior_signals (phone,signal_type,key,value,strength,last_seen,created_at) VALUES (?,?,?,?,?,?,?)`,[signal.phone,signal.signal_type,signal.key,valueStr,signal.strength??0.5,now,now]); saveDb(); }
export async function getUserBehaviorSignals(phone:string, signalType?:string):Promise<any[]> { const database=await getDb(); let q="SELECT * FROM user_behavior_signals WHERE phone=?"; const p:any[]=[phone]; if(signalType){q+=" AND signal_type=?";p.push(signalType);} q+=" ORDER BY id DESC LIMIT 50"; const stmt=database.prepare(q);stmt.bind(p);const results:any[]=[];while(stmt.step()){const row=stmt.getAsObject();try{row.value=JSON.parse(row.value);}catch{}results.push(row);}stmt.free();return results; }
export async function getSystemSetting(key:string, defaultValue:string=''):Promise<string>{const database=await getDb();const stmt=database.prepare("SELECT value FROM system_settings WHERE key=?");stmt.bind([key]);let val=defaultValue;if(stmt.step()){const row=stmt.getAsObject();val=row.value!==undefined?String(row.value):defaultValue;}stmt.free();return val;}
export async function setSystemSetting(key:string,value:string):Promise<void>{const database=await getDb();database.run("INSERT OR REPLACE INTO system_settings (key,value) VALUES (?,?)",[key,value]);saveDb();}

export async function createEconomicOrder(input: { id:string; phone:string; skill:string; category:string; requirements:Record<string,unknown>; capabilities:string[]; amount?:number }) {
    const database=await getDb();
    const stmt=database.prepare(`INSERT INTO orders (id,phone,order_type,amount,status,category,requirements_json,capabilities_json,provider_status) VALUES (?,?,?,?,?,?,?,?,?)`);
    stmt.bind([input.id,input.phone,input.skill,input.amount??0,'requested',input.category,JSON.stringify(input.requirements||{}),JSON.stringify(input.capabilities||[]),'unmatched']);stmt.step();stmt.free();saveDb();return input.id;
}
export async function getEconomicOrder(id:string){const database=await getDb();const stmt=database.prepare(`SELECT * FROM orders WHERE id=? LIMIT 1`);stmt.bind([id]);const row=stmt.step()?stmt.getAsObject():null;stmt.free();if(!row)return null;return {...row,requirements:JSON.parse(String(row.requirements_json||'{}')),capabilities:JSON.parse(String(row.capabilities_json||'[]')),quote:row.quote_json?JSON.parse(String(row.quote_json)):null,fulfillment:row.fulfillment_json?JSON.parse(String(row.fulfillment_json)):null};}
export async function transitionEconomicOrder(id:string,status:string,patch:Record<string,unknown>={}){const current=await getEconomicOrder(id);if(!current)throw new Error('Economic request not found');const allowed:Record<string,string[]>={requested:['awaiting_match','abandoned'],awaiting_match:['partially_matched','fulfilled','abandoned'],partially_matched:['fulfilled','abandoned'],fulfilled:[],abandoned:[]};if(status!==current.status&&!allowed[String(current.status)]?.includes(status))throw new Error(`Invalid economic request transition: ${current.status} -> ${status}`);const database=await getDb();const stmt=database.prepare(`UPDATE orders SET status=?,provider_phone=COALESCE(?,provider_phone),provider_status=COALESCE(?,provider_status),quote_json=COALESCE(?,quote_json),fulfillment_json=COALESCE(?,fulfillment_json) WHERE id=?`);stmt.bind([status,patch.provider_phone??null,patch.provider_status??null,patch.quote?JSON.stringify(patch.quote):null,patch.fulfillment?JSON.stringify(patch.fulfillment):null,id]);stmt.step();stmt.free();saveDb();return getEconomicOrder(id);}
