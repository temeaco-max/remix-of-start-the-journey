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
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    database.run(`
        CREATE TABLE IF NOT EXISTS memory_profiles (
            phone TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            location TEXT,
            primary_lga TEXT,
            primary_state TEXT,
            country TEXT DEFAULT 'ng',
            subscription_tier TEXT DEFAULT 'Base',
            points_balance INTEGER DEFAULT 30,
            wallet_balance_minor INTEGER DEFAULT 30,
            currency TEXT DEFAULT 'NGN',
            preferences TEXT,
            behavior_patterns TEXT,
            inferred_roles TEXT,
            grace_leads INTEGER DEFAULT 0,
            fcm_token TEXT,
            is_available INTEGER DEFAULT 0,
            is_contributor INTEGER DEFAULT 0,
            nin TEXT,
            verified_provider INTEGER DEFAULT 0,
            livecast_signals_remaining INTEGER DEFAULT 30,
            trust_score REAL DEFAULT 5.0,
            last_active_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migration: memory_profiles table
    const profileResult = database.exec("PRAGMA table_info(memory_profiles)");
    if (profileResult && profileResult.length > 0 && profileResult[0].values) {
        const profileColumns = profileResult[0].values.map((col: any) => col[1]);
        if (!profileColumns.includes('email')) database.run("ALTER TABLE memory_profiles ADD COLUMN email TEXT");
        if (!profileColumns.includes('primary_lga')) database.run("ALTER TABLE memory_profiles ADD COLUMN primary_lga TEXT");
        if (!profileColumns.includes('points_balance')) {
            database.run("ALTER TABLE memory_profiles ADD COLUMN points_balance INTEGER DEFAULT 30");
            database.run("UPDATE memory_profiles SET points_balance = COALESCE(wallet_balance_minor, 30) WHERE points_balance IS NULL OR points_balance = 0");
        }
        if (!profileColumns.includes('primary_state')) database.run("ALTER TABLE memory_profiles ADD COLUMN primary_state TEXT");
        if (!profileColumns.includes('livecast_signals_remaining')) database.run("ALTER TABLE memory_profiles ADD COLUMN livecast_signals_remaining INTEGER DEFAULT 30");
        if (!profileColumns.includes('trust_score')) database.run("ALTER TABLE memory_profiles ADD COLUMN trust_score REAL DEFAULT 5.0");
        if (!profileColumns.includes('last_active_at')) database.run("ALTER TABLE memory_profiles ADD COLUMN last_active_at TEXT");
        if (!profileColumns.includes('full_name')) database.run("ALTER TABLE memory_profiles ADD COLUMN full_name TEXT");
        if (!profileColumns.includes('sso_provider')) database.run("ALTER TABLE memory_profiles ADD COLUMN sso_provider TEXT");
        if (!profileColumns.includes('sso_provider_id')) database.run("ALTER TABLE memory_profiles ADD COLUMN sso_provider_id TEXT");
        if (!profileColumns.includes('email_verified_at')) database.run("ALTER TABLE memory_profiles ADD COLUMN email_verified_at TEXT");
        if (!profileColumns.includes('display_name')) database.run("ALTER TABLE memory_profiles ADD COLUMN display_name TEXT");
        if (!profileColumns.includes('subscription_expiry')) database.run("ALTER TABLE memory_profiles ADD COLUMN subscription_expiry TEXT");
        if (!profileColumns.includes('available_for_work')) database.run("ALTER TABLE memory_profiles ADD COLUMN available_for_work INTEGER DEFAULT 0");
    }

    // Migration: escrow table
    const escrowResult = database.exec("PRAGMA table_info(escrow)");
    if (escrowResult && escrowResult.length > 0 && escrowResult[0].values) {
        const escrowColumns = escrowResult[0].values.map((col: any) => col[1]);
        if (!escrowColumns.includes('order_id')) database.run("ALTER TABLE escrow ADD COLUMN order_id TEXT");
        if (!escrowColumns.includes('booking_type')) database.run("ALTER TABLE escrow ADD COLUMN booking_type TEXT");
        if (!escrowColumns.includes('cooling_off_until')) database.run("ALTER TABLE escrow ADD COLUMN cooling_off_until TEXT");
        if (!escrowColumns.includes('completed_at')) database.run("ALTER TABLE escrow ADD COLUMN completed_at TEXT");
        if (!escrowColumns.includes('dispute_reason')) database.run("ALTER TABLE escrow ADD COLUMN dispute_reason TEXT");
    }

    database.run(`
        CREATE TABLE IF NOT EXISTS profile_access_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            service_name TEXT,
            action TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS keep_alive_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            event_type TEXT,
            cost_impact REAL DEFAULT 0.0,
            metadata TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS temp_sessions (
            sessionId TEXT PRIMARY KEY,
            location TEXT,
            interactions TEXT,
            preferences TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            sender TEXT,
            content TEXT,
            channel TEXT DEFAULT 'pwa',
            card_data TEXT,
            status TEXT DEFAULT 'sent',
            whatsapp_msg_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS credit_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            amount INTEGER,
            type TEXT,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pulse_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            skill TEXT,
            lat REAL,
            lng REAL,
            expires_at TEXT,
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS provider_presence (
            phone TEXT PRIMARY KEY,
            is_live INTEGER DEFAULT 0,
            operation_mode TEXT DEFAULT 'stationary',
            last_lat REAL,
            last_lng REAL,
            fuzzed_radius_m INTEGER DEFAULT 100,
            live_until TEXT,
            last_confirmed TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(phone) REFERENCES memory_profiles(phone)
        );

        CREATE TABLE IF NOT EXISTS user_behavior_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            signal_type TEXT,
            key TEXT,
            value TEXT,
            strength REAL DEFAULT 0.5,
            last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(phone) REFERENCES memory_profiles(phone)
        );

        CREATE TABLE IF NOT EXISTS escrow (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            buyer_phone TEXT,
            provider_phone TEXT,
            amount_minor INTEGER,
            description TEXT,
            status TEXT DEFAULT 'held',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            order_id TEXT,
            reason TEXT,
            status TEXT DEFAULT 'open',
            resolution TEXT,
            type TEXT DEFAULT 'dispute',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS content (
            slug TEXT PRIMARY KEY,
            title TEXT,
            body TEXT,
            type TEXT,
            author TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        INSERT OR REPLACE INTO content (slug, title, body, type, author) VALUES (
            'rotating-banner-texts',
            'Mobile Rotating Banner Texts',
            'One number. One conversation. Tell it what you need or what you can do.
Tell it what you want, anytime, anywhere — always ready to assist.
Your always-on neighborhood guide & helper right in your chat.
Find verified local plumbers, riders, bakers, and electricians instantly.
List your skills, offer services, and discover daily local gigs.
Keep your transactions secure with smart escrow payments.
Receive real-time, proactive notifications and opportunity alerts.
Get daily life-admin reminders, price checks, and marketplace updates.
Support your family and send secure mobile money home seamlessly.
No downloads. No new apps. All through one simple conversation.
AI assistive software designed for everyday tasks & life',
            'page',
            'Kurukoo Team'
        );

        CREATE TABLE IF NOT EXISTS money_circles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            creator_phone TEXT,
            target_amount REAL,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS circle_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            circle_id INTEGER,
            phone TEXT,
            role TEXT DEFAULT 'member'
        );

        CREATE TABLE IF NOT EXISTS circle_contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            circle_id INTEGER,
            phone TEXT,
            amount REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country TEXT,
            name TEXT,
            phone TEXT
        );

        CREATE TABLE IF NOT EXISTS survey_opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT,
            options TEXT
        );

        CREATE TABLE IF NOT EXISTS survey_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT
        );

        CREATE TABLE IF NOT EXISTS livecast_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            lat REAL,
            lng REAL
        );

        CREATE TABLE IF NOT EXISTS processed_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_ref TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_phone TEXT,
            referred_phone TEXT,
            rewarded INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS unknown_intents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT
        );

        CREATE TABLE IF NOT EXISTS sent_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            question TEXT
        );

        CREATE TABLE IF NOT EXISTS compliance_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT
        );

        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT,
            content TEXT
        );

        CREATE TABLE IF NOT EXISTS price_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT,
            price REAL
        );

        CREATE TABLE IF NOT EXISTS classifieds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            price REAL
        );

        CREATE TABLE IF NOT EXISTS appointment_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_phone TEXT,
            provider_phone TEXT,
            slot_time TEXT,
            status TEXT
        );

        CREATE TABLE IF NOT EXISTS affiliate_clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            details TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            phone TEXT,
            order_type TEXT,
            provider_phone TEXT,
            amount INTEGER,
            status TEXT,
            idempotency_key TEXT UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ad_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            desc TEXT,
            image_url TEXT,
            target_keyword TEXT,
            credits_budget INTEGER,
            credits_spent INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT,
            subject TEXT,
            body TEXT,
            status TEXT,
            sent_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS future_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            phase TEXT,
            status TEXT
        );

        CREATE TABLE IF NOT EXISTS ai_agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            system_prompt TEXT,
            skills TEXT,
            tools TEXT,
            status TEXT DEFAULT 'active',
            lga TEXT,
            concurrency_limit INTEGER DEFAULT 5,
            token_quota_daily INTEGER DEFAULT 10000,
            cost_threshold_usd REAL DEFAULT 1.0,
            temperature REAL DEFAULT 0.2,
            tokens_used_today INTEGER DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            escalation_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scam_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_phone TEXT,
            reported_phone TEXT,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS social_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT,
            content TEXT,
            scheduled_time TEXT,
            status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS partnerships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            contact TEXT,
            status TEXT,
            next_action TEXT,
            due_date TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS micro_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            skill_tag TEXT,
            credits_reward INTEGER,
            status TEXT DEFAULT 'available',
            assigned_to TEXT
        );

        CREATE TABLE IF NOT EXISTS service_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            options TEXT
        );

        CREATE TABLE IF NOT EXISTS success_stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_text TEXT,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS social_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_text TEXT,
            platform TEXT,
            scheduled_for DATETIME,
            posted INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS badges (
            phone TEXT,
            badge_type TEXT,
            awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (phone, badge_type)
        );

        CREATE TABLE IF NOT EXISTS celebrity_demand (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            category TEXT,
            interested_users INTEGER DEFAULT 0,
            threshold INTEGER DEFAULT 5000,
            status TEXT DEFAULT 'tracking',
            report_generated INTEGER DEFAULT 0,
            contacted INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS provider_leaderboard (
            phone TEXT PRIMARY KEY,
            skill TEXT,
            monthly_jobs INTEGER DEFAULT 0,
            monthly_rating REAL DEFAULT 0.0,
            rank INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS pricing (
            plan TEXT,
            country TEXT,
            monthly_price_minor INTEGER,
            currency TEXT,
            credits_per_month INTEGER,
            features TEXT,
            active INTEGER DEFAULT 1,
            PRIMARY KEY (plan, country)
        );

        

        CREATE TABLE IF NOT EXISTS provider_subscriptions (
            phone TEXT PRIMARY KEY,
            tier TEXT NOT NULL,
            status TEXT NOT NULL,
            next_billing_date TEXT NOT NULL,
            leads_this_month INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS commission_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT UNIQUE,
            rate_minor INTEGER,
            description TEXT,
            active INTEGER DEFAULT 1
        );
    `);

    // Migration: referrals table
    const result = database.exec("PRAGMA table_info(referrals)");
    if (result && result.length > 0 && result[0].values) {
        const referralsColumns = result[0].values.map((col: any) => col[1]);
        if (!referralsColumns.includes('status')) database.run("ALTER TABLE referrals ADD COLUMN status TEXT DEFAULT 'pending'");
        if (!referralsColumns.includes('referral_code')) database.run("ALTER TABLE referrals ADD COLUMN referral_code TEXT");
        if (!referralsColumns.includes('created_at')) database.run("ALTER TABLE referrals ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }

    // Migration: skills table
    const skillsResult = database.exec("PRAGMA table_info(skills)");
    if (skillsResult && skillsResult.length > 0 && skillsResult[0].values) {
        const skillsColumns = skillsResult[0].values.map((col: any) => col[1]);
        if (!skillsColumns.includes('verified_artist')) database.run("ALTER TABLE skills ADD COLUMN verified_artist BOOLEAN DEFAULT 0");
    }

    // Migration: ai_agents table
    const agentsResult = database.exec("PRAGMA table_info(ai_agents)");
    if (agentsResult && agentsResult.length > 0 && agentsResult[0].values) {
        const agentsColumns = agentsResult[0].values.map((col: any) => col[1]);
        if (!agentsColumns.includes('avatar')) database.run("ALTER TABLE ai_agents ADD COLUMN avatar TEXT DEFAULT '🤖'");
    }

    // Migration: messages table
    const messagesResult = database.exec("PRAGMA table_info(messages)");
    if (messagesResult && messagesResult.length > 0 && messagesResult[0].values) {
        const messagesColumns = messagesResult[0].values.map((col: any) => col[1]);
        if (!messagesColumns.includes('status')) database.run("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'");
        if (!messagesColumns.includes('whatsapp_msg_id')) database.run("ALTER TABLE messages ADD COLUMN whatsapp_msg_id TEXT");
    }
    database.run("CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone)");
    database.run("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)");

    const emergency = [
        ['ng', 'Police Emergency', '112'],
        ['ng', 'Federal Road Safety (FRSC)', '122'],
        ['ng', 'Lagos State Emergency (LASEMA)', '767'],
    ];
    for (const e of emergency) {
        database.run(`INSERT OR IGNORE INTO emergency_contacts (country, name, phone) VALUES (?, ?, ?)`, e);
    }

    const pricingSeeds = [
        ['base', 'ng', 50000, 'NGN', 30, JSON.stringify(["Access to all categories", "Post/accept gigs", "Nearby Pulse (5 free hours/mo)", "Basic support"]), 1],
        ['plus', 'ng', 150000, 'NGN', 60, JSON.stringify(["Unlimited Nearby Pulse", "Priority support", "Boost listing (1 free/mo)", "SMS fallback"]), 1],
        ['business', 'ng', 500000, 'NGN', 120, JSON.stringify(["Storefront with product catalogue", "Sales analytics", "Priority placement", "Dedicated account manager", "Bulk job acceptance"]), 1],
    ];
    for (const p of pricingSeeds) {
        database.run(`INSERT OR IGNORE INTO pricing (plan, country, monthly_price_minor, currency, credits_per_month, features, active) VALUES (?, ?, ?, ?, ?, ?, ?)`, p);
    }

    const commissionSeeds = [
        ['agent_signup', 5000, 'Agent signup reward commission', 1],
        ['agent_topup', 1000, 'Agent top-up commission', 1],
        ['agent_provider_onboard', 20000, 'Agent provider onboarding commission', 1],
        ['provider_lead_ride', 5000, 'Lead charge - okada/keke/car driver', 1],
        ['provider_lead_delivery', 3000, 'Lead charge - bicycle delivery', 1],
        ['provider_lead_hawker', 2000, 'Lead charge - hawker / street food vendor', 1],
        ['provider_lead_professional', 5000, 'Lead charge - professional service', 1],
        ['platform_lead_default', 3000, 'Default platform lead charge', 1],
    ];
    for (const c of commissionSeeds) {
        database.run(`INSERT OR IGNORE INTO commission_config (type, rate_minor, description, active) VALUES (?, ?, ?, ?)`, c);
    }

    const serviceCatSeeds = [
        ['Transport / Delivery', JSON.stringify(['Okada (₦500)', 'Keke (₦800)', 'Taxi / Car (₦2,000)', 'Bicycle Delivery (₦300)'])],
        ['Skilled Worker', JSON.stringify(['Plumber & Repairs', 'Electrician', 'Baker & Caterer', 'IT Support & Tech'])],
        ['Circle Savings', JSON.stringify(['Join Active Circle', 'Create New Circle', 'Check Contribution Status'])]
    ];
    for (const sc of serviceCatSeeds) {
        database.run(`INSERT OR IGNORE INTO service_categories (title, options) VALUES (?, ?)`, sc);
    }

    const futurePlansSeeds = [
        ['MVNO licence', 'Mobile + home internet + TV bundle', 'Phase 3', 'planned'],
        ['Kurukoo Smart City', 'Full smart-city integration', 'Phase 4', 'planned'],
        ['Quad-Play bundle', 'Integrated service billing', 'Phase 3', 'planned'],
        ['Peer-to-peer energy trading', 'Solar grid energy exchange', 'Phase 4', 'planned']
    ];
    for (const fp of futurePlansSeeds) {
        database.run(`INSERT OR IGNORE INTO future_plans (title, description, phase, status) VALUES (?, ?, ?, ?)`, fp);
    }

    const microTasksSeeds = [
        ['Content Moderation', 'Review reported scam messages', 'moderation', 10],
        ['Skill Tagging', 'Tag ambiguous user requests with appropriate skills', 'tagging', 5],
        ['Price Reporting', 'Report the current price of rice in your local market', 'price_check', 20],
        ['Translation', 'Translate system prompts to Pidgin', 'translation', 15],
        ['Welcome Ambassador', 'Onboard a new user and explain the platform', 'ambassador', 50],
        ['Store Verification', 'Visit a local bakery and verify their existence', 'verification', 100]
    ];
    for (const mt of microTasksSeeds) {
        database.run(`INSERT OR IGNORE INTO micro_tasks (title, description, skill_tag, credits_reward) VALUES (?, ?, ?, ?)`, mt);
    }

    const partnershipsSeeds = [
        ['MTN', 'Jane Doe', 'initial contact', 'Follow up on API access', '2026-08-01', 'Discussing zero-rating for PWA'],
        ['OPay', 'John Smith', 'sandbox integration', 'Test webhook events', '2026-07-28', 'Sandbox credentials received'],
        ['Jumia', 'Alice Johnson', 'affiliate agreement pending', 'Review contract terms', '2026-08-05', 'Negotiating commission rates'],
        ['Stripe', 'Bob Williams', 'UK integration Phase 2', 'Complete KYC checks', '2026-09-01', 'For UK diaspora remittances']
    ];
    for (const ps of partnershipsSeeds) {
        database.run(`INSERT OR IGNORE INTO partnerships (company, contact, status, next_action, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)`, ps);
    }
}

function seedSkillFlows(database: any) {
    const skillsList = [
        // Get Things Done
        { s: 'rider', q: [{ q: 'What is your pickup location?', options: [] }, { q: 'What is your dropoff location?', options: [] }], a: 'lead', i: 'Find nearest active riders' },
        { s: 'plumber', q: [{ q: 'What plumbing issue are you facing?', options: ['Leaking pipe', 'Blocked drain', 'Toilet repair', 'Other'] }], a: 'lead', i: 'Match with certified local plumber' },
        { s: 'electrician', q: [{ q: 'Describe the electrical job', options: ['Wiring', 'Fixture install', 'Fault finding', 'Other'] }], a: 'lead', i: 'Match with licensed electrician' },
        { s: 'carpenter', q: [{ q: 'Select carpentry service', options: ['Furniture repair', 'Cabinet making', 'Door install', 'Other'] }], a: 'lead', i: 'Match local carpenter' },
        { s: 'painter', q: [{ q: 'What painting job is required?', options: ['Interior', 'Exterior', 'Single room', 'Touch up'] }], a: 'lead', i: 'Match local painter' },
        { s: 'mechanic', q: [{ q: 'What is the vehicle issue?', options: ['Engine sound', 'Brakes', 'Oil change', 'Battery', 'Not starting'] }], a: 'lead', i: 'Match vehicle mechanic' },
        { s: 'ac_repair', q: [{ q: 'AC unit issue', options: ['Not cooling', 'Leaking water', 'Noisy', 'Gas refill'] }], a: 'lead', i: 'Match AC technician' },
        { s: 'generator_repair', q: [{ q: 'Generator issue', options: ['Not starting', 'Smoking', 'Service required', 'Other'] }], a: 'lead', i: 'Match generator repairman' },
        { s: 'welder', q: [{ q: 'Welding requirement', options: ['Gate repair', 'Burglar proofing', 'Structural', 'Other'] }], a: 'lead', i: 'Match local welder' },
        { s: 'mason', q: [{ q: 'Masonry service required', options: ['Bricklaying', 'Plastering', 'Concrete work', 'Other'] }], a: 'lead', i: 'Match local bricklayer/mason' },
        { s: 'roofer', q: [{ q: 'Roofing service', options: ['Roof leak repair', 'New roofing', 'Gutter cleaning'] }], a: 'lead', i: 'Match roofing expert' },
        { s: 'tiler', q: [{ q: 'Tiling area', options: ['Bathroom', 'Kitchen', 'Living room', 'Wall tiling'] }], a: 'lead', i: 'Match professional tiler' },
        { s: 'handyman', q: [{ q: 'What task do you need help with?', options: ['TV wall mounting', 'Hanging curtains', 'Shelf assembly', 'General fix'] }], a: 'lead', i: 'Match nearby handyman' },
        { s: 'locksmith', q: [{ q: 'Locksmith service', options: ['Emergency lockout', 'Lock change', 'Key duplication'] }], a: 'lead', i: 'Match security locksmith' },
        { s: 'phone_repair', q: [{ q: 'Select your phone issue', options: ['Screen replacement', 'Battery change', 'Charging port', 'Software'] }], a: 'lead', i: 'Match mobile repair technician' },
        { s: 'computer_repair', q: [{ q: 'What is the computer issue?', options: ['Slow performance', 'Screen replacement', 'Virus removal', 'Hardware repair'] }], a: 'lead', i: 'Match computer technician' },
        { s: 'cleaner', q: [{ q: 'Type of cleaning', options: ['Deep cleaning', 'Standard cleaning', 'Post-construction', 'Office'] }], a: 'lead', i: 'Match residential cleaner' },
        { s: 'housekeeper', q: [{ q: 'Housekeeping frequency', options: ['One-off', 'Weekly', 'Bi-weekly', 'Full-time'] }], a: 'lead', i: 'Match housekeeper' },
        { s: 'tailor', q: [{ q: 'Select service', options: ['Custom dressmaking', 'Alterations', 'Suit tailoring'] }], a: 'appointment', i: 'Match custom tailor' },
        { s: 'fashion_designer', q: [{ q: 'Select design type', options: ['Traditional', 'Modern', 'Corporate', 'Wedding'] }], a: 'appointment', i: 'Schedule consultation with fashion designer' },
        { s: 'makeup_artist', q: [{ q: 'What is the occasion?', options: ['Wedding', 'Photoshoot', 'Party', 'Casual'] }], a: 'appointment', i: 'Match professional makeup artist' },
        { s: 'hairdresser', q: [{ q: 'Select hairstyle service', options: ['Braiding', 'Weaving', 'Wig installation', 'Wash and dry'] }], a: 'lead', i: 'Match local hairdresser' },
        { s: 'barber', q: [{ q: 'Select haircut type', options: ['Fade', 'Buzz cut', 'Shave', 'Beard trim'] }], a: 'lead', i: 'Match local barber' },
        { s: 'tutor', q: [{ q: 'What subject/level?', options: ['Primary Math', 'Secondary Science', 'College Prep', 'Other'] }], a: 'appointment', i: 'Schedule session with tutor' },
        { s: 'music_teacher', q: [{ q: 'Select instrument', options: ['Piano', 'Guitar', 'Violin', 'Voice coaching'] }], a: 'appointment', i: 'Schedule session with music instructor' },
        { s: 'coding_instructor', q: [{ q: 'Select language/track', options: ['Scratch for Kids', 'Python Basics', 'Web Development', 'Data Science'] }], a: 'appointment', i: 'Schedule session with coding instructor' },
        { s: 'language_teacher', q: [{ q: 'Select language', options: ['English', 'French', 'Spanish', 'Yoruba', 'Hausa', 'Igbo'] }], a: 'appointment', i: 'Schedule language lesson' },
        { s: 'doctor', q: [{ q: 'Consultation type', options: ['General health check', 'Prescription renewal', 'Specialist advice'] }], a: 'appointment', i: 'Schedule doctor consultation' },
        { s: 'nurse', q: [{ q: 'Select nursing service', options: ['Home care support', 'Injections & dressing', 'Elderly care', 'Maternity care'] }], a: 'appointment', i: 'Schedule nurse visit' },
        { s: 'pharmacist', q: [{ q: 'Select pharmacy service', options: ['Prescription advice', 'Drug interaction check', 'Alternative medicine info'] }], a: 'appointment', i: 'Schedule pharmacist consultation' },
        { s: 'dentist', q: [{ q: 'Select dental issue', options: ['Teeth cleaning', 'Toothache', 'Filling', 'Braces checkup'] }], a: 'appointment', i: 'Schedule dental checkup' },
        { s: 'physiotherapist', q: [{ q: 'Select physical therapy need', options: ['Post-injury rehab', 'Back pain', 'Stroke recovery', 'Joint stiffness'] }], a: 'appointment', i: 'Schedule physical therapy session' },
        { s: 'herbalist', q: [{ q: 'Herbal service required', options: ['General consultation', 'Organic remedies', 'Skin/Hair care solutions'] }], a: 'appointment', i: 'Schedule consultation with herbalist' },
        { s: 'traditional_healer', q: [{ q: 'Traditional consulting method', options: ['General wellness', 'Spiritual consulting', 'Organic healing herbs'] }], a: 'appointment', i: 'Schedule session with healer' },
        { s: 'photographer', q: [{ q: 'Select event type', options: ['Wedding', 'Birthday photoshoot', 'Corporate event', 'Model portfolio'] }], a: 'appointment', i: 'Match professional photographer' },
        { s: 'videographer', q: [{ q: 'Select video service', options: ['Music video', 'Wedding coverage', 'YouTube content', 'Corporate promo'] }], a: 'appointment', i: 'Match professional videographer' },
        { s: 'dj', q: [{ q: 'Select party/event type', options: ['Club gig', 'Wedding reception', 'Corporate party', 'Birthday party'] }], a: 'appointment', i: 'Match event DJ' },
        { s: 'mc', q: [{ q: 'What type of event?', options: ['Wedding MC', 'Corporate event', 'Concert', 'Private party'] }], a: 'appointment', i: 'Match event MC' },
        { s: 'event_planner', q: [{ q: 'Describe your event planning need', options: ['Full planning', 'Day-of coordination', 'Venue sourcing'] }], a: 'appointment', i: 'Match professional event planner' },
        { s: 'caterer', q: [{ q: 'Select catering menu style', options: ['Traditional buffet', 'Finger foods / chops', 'Plated fine dining'] }], a: 'appointment', i: 'Match certified caterer' },
        { s: 'chef', q: [{ q: 'What is the chef request?', options: ['Private home dinner', 'Meal prep service', 'Cooking masterclass'] }], a: 'appointment', i: 'Match private chef' },
        { s: 'baker', q: [{ q: 'Select baking request', options: ['Wedding cake', 'Birthday cake', 'Pastries / Bread', 'Custom cupcakes'] }], a: 'appointment', i: 'Match custom baker' },
        { s: 'security_guard', q: [{ q: 'Security duration', options: ['Short-term event', 'Long-term residential', 'Business premises'] }], a: 'lead', i: 'Match security guard' },
        { s: 'bodyguard', q: [{ q: 'Select protection level', options: ['Executive VIP protection', 'Event bodyguard', 'Transit escort'] }], a: 'lead', i: 'Match trained bodyguard' },
        { s: 'personal_trainer', q: [{ q: 'Select training goal', options: ['Weight loss', 'Muscle building', 'General conditioning', 'Diet planning'] }], a: 'appointment', i: 'Match personal fitness trainer' },
        { s: 'yoga_instructor', q: [{ q: 'Select yoga style', options: ['Vinyasa flow', 'Hatha', 'Restorative', 'Meditation session'] }], a: 'appointment', i: 'Match yoga instructor' },
        { s: 'driving_instructor', q: [{ q: 'Select driving lesson level', options: ['Beginner', 'Refresher', 'Test prep', 'Defensive driving'] }], a: 'appointment', i: 'Match licensed driving instructor' },
        { s: 'delivery', q: [{ q: 'What is the parcel size?', options: ['Documents / Envelope', 'Small parcel', 'Medium box', 'Heavy / Bulky cargo'] }], a: 'lead', i: 'Dispatch courier runner' },
        { s: 'dispatch_rider', q: [{ q: 'What item needs dispatching?', options: ['Food delivery', 'E-commerce package', 'Documents'] }], a: 'lead', i: 'Match active dispatch rider' },
        { s: 'errand_agent', q: [{ q: 'Describe the errand', options: ['Market shopping', 'Utility payment walk-in', 'Pick & drop', 'Other'] }], a: 'lead', i: 'Match errand agent' },
        { s: 'travel_agent', q: [{ q: 'Select travel service', options: ['Flight bookings', 'Visa documentation helper', 'Holiday packages'] }], a: 'appointment', i: 'Match travel booking consultant' },
        { s: 'tour_guide', q: [{ q: 'Select tour area/type', options: ['City historical tour', 'Nature trail', 'Cultural / Food tasting'] }], a: 'appointment', i: 'Match local tour guide' },
        { s: 'realtor', q: [{ q: 'Select real estate goal', options: ['Buying property', 'Selling property', 'Investing in land'] }], a: 'appointment', i: 'Match licensed realtor' },
        { s: 'estate_agent', q: [{ q: 'Select agency assistance', options: ['Renting an apartment', 'Leasing commercial space', 'Property valuation'] }], a: 'appointment', i: 'Match local estate agent' },
        { s: 'landlord', q: [{ q: 'Select property management service', options: ['Tenant screening', 'Rent collection support', 'Maintenance coordination'] }], a: 'appointment', i: 'Match landlord helper' },
        { s: 'lawyer', q: [{ q: 'Select legal domain', options: ['Business / Corporate', 'Property / Real Estate', 'Family law', 'Civil dispute'] }], a: 'appointment', i: 'Schedule consultation with lawyer' },
        { s: 'accountant', q: [{ q: 'Select accounting task', options: ['Bookkeeping', 'Financial audits', 'Company registration support'] }], a: 'appointment', i: 'Schedule consultation with accountant' },
        { s: 'tax_preparer', q: [{ q: 'What is your tax prep filing status?', options: ['Individual self-employed', 'Corporate tax', 'VAT returns'] }], a: 'appointment', i: 'Schedule consultation with tax preparer' },
        { s: 'visa_agent', q: [{ q: 'Select destination country', options: ['United Kingdom', 'United States', 'Schengen Area', 'Canada', 'Other'] }], a: 'appointment', i: 'Match experienced visa consultant' },
        { s: 'insurance_broker', q: [{ q: 'Select insurance type', options: ['Health insurance', 'Vehicle insurance', 'Business / Shop insurance', 'Life cover'] }], a: 'appointment', i: 'Match licensed insurance broker' },

        // Earn Money & Business
        { s: 'graphic_designer', q: [{ q: 'What design do you need?', options: ['Logo & Branding', 'Social media graphics', 'Flyer / Poster design', 'UI/UX wireframes'] }], a: 'appointment', i: 'Match creative graphic designer' },
        { s: 'web_developer', q: [{ q: 'Select development service', options: ['Landing page', 'E-commerce store', 'WordPress site', 'Custom full-stack app'] }], a: 'appointment', i: 'Match experienced web developer' },
        { s: 'content_writer', q: [{ q: 'Select writing format', options: ['SEO blog post', 'Copywriting for sales', 'Academic proofreading', 'Technical writing'] }], a: 'appointment', i: 'Match professional content writer' },
        { s: 'virtual_assistant', q: [{ q: 'Select daily task help', options: ['Email management', 'Data entry', 'Calendar scheduling', 'Customer support'] }], a: 'appointment', i: 'Match virtual assistant' },
        { s: 'social_media_manager', q: [{ q: 'Select platform target', options: ['Instagram & TikTok', 'LinkedIn', 'Facebook', 'Twitter / X'] }], a: 'appointment', i: 'Match social media manager' },
        { s: 'video_editor', q: [{ q: 'Select video edit style', options: ['Social Media Reels / Shorts', 'YouTube full video', 'Event highlights', 'Ad video'] }], a: 'appointment', i: 'Match creative video editor' },
        { s: 'translator', q: [{ q: 'Select translation type', options: ['Written document translation', 'Subtitling video', 'Localization testing'] }], a: 'appointment', i: 'Match professional translator' },
        { s: 'interpreter', q: [{ q: 'Select interpretation setup', options: ['Real-time phone interpretation', 'Physical event interpreter', 'Business meeting support'] }], a: 'appointment', i: 'Match live voice interpreter' },
        { s: 'solar_installer', q: [{ q: 'Solar installation capacity', options: ['Small home backup (1-2kVA)', 'Medium residential (3-5kVA)', 'Commercial premises (10kVA+)', 'Inverter battery service'] }], a: 'lead', i: 'Match certified solar technician' },
        { s: 'borehole_driller', q: [{ q: 'Describe borehole requirement', options: ['New borehole drilling', 'Water pump maintenance', 'Water treatment setup'] }], a: 'lead', i: 'Match industrial borehole team' },
        { s: 'fabricator', q: [{ q: 'Select fabrication service', options: ['Iron gate', 'Aluminium windows', 'Steel frameworks', 'Custom metal design'] }], a: 'lead', i: 'Match heavy metal fabricator' },
        { s: 'scaffolder', q: [{ q: 'Scaffolding scale', options: ['Single-story residential', 'Multi-story building', 'Industrial setup'] }], a: 'lead', i: 'Match certified scaffolders' },
        { s: 'steel_fixer', q: [{ q: 'Select steel fixing job', options: ['Foundation reinforcement', 'Slab iron laying', 'Columns & beams'] }], a: 'lead', i: 'Match construction steel fixers' },

        // Community & Safety
        { s: 'lost_pet_responder', q: [{ q: 'Select pet type', options: ['Dog', 'Cat', 'Other'] }, { q: 'Enter last seen location', options: [] }], a: 'lead', i: 'Notify local neighborhood search network' },
        { s: 'found_pet_reporter', q: [{ q: 'Select found pet description', options: ['Friendly dog', 'Friendly cat', 'Bird', 'Other'] }, { q: 'Enter current holding location', options: [] }], a: 'lead', i: 'Alert nearby pet owners' },
        { s: 'street_watch_captain', q: [{ q: 'Select watch alert type', options: ['Report suspicious activity', 'Organize street sweep', 'Request patrol presence'] }], a: 'lead', i: 'Dispatch security advisory/captain' },
        { s: 'food_bank_helper', q: [{ q: 'Select helper task', options: ['Food sorting', 'Donation pickup', 'Distribution team'] }], a: 'appointment', i: 'Register volunteer spot at food bank' },
        { s: 'litter_picker', q: [{ q: 'Litter zone size', options: ['Single street', 'Public park', 'School area'] }], a: 'lead', i: 'Coordinate community litter pick' },
        { s: 'school_run_driver', q: [{ q: 'Select pickup time window', options: ['Morning dropoff', 'Afternoon pickup', 'Both morning & afternoon'] }], a: 'lead', i: 'Match verified school run driver' },
        { s: 'nanny', q: [{ q: 'Select nanny schedule', options: ['Live-in nanny', 'Live-out full time', 'Temporary support'] }], a: 'appointment', i: 'Match professional child caregiver' },
        { s: 'babysitter', q: [{ q: 'Select babysitting hours', options: ['Evening date night', 'Daytime weekend', 'After-school care'] }], a: 'lead', i: 'Match background-checked babysitter' },
        { s: 'dog_walker', q: [{ q: 'Select walk duration', options: ['30 minutes', '1 hour', 'Daily walking slot'] }], a: 'lead', i: 'Match local dog walker' },
        { s: 'pet_sitter', q: [{ q: 'Select sitting location', options: ['In my home', 'At sitter\'s home', 'Drop-in feeding visits'] }], a: 'lead', i: 'Match local pet sitter' },
        { s: 'car_wash', q: [{ q: 'Select wash package', options: ['Exterior body wash', 'Interior deep clean', 'Premium detailing & wax'] }], a: 'lead', i: 'Match mobile car wash specialist' },
        { s: 'tyre_repair', q: [{ q: 'Tyre repair service', options: ['Flat tyre patch', 'Tyre valve swap', 'Air pressure topup'] }], a: 'lead', i: 'Match nearby tyre technician' },
        { s: 'vulcanizer', q: [{ q: 'What is the service spot?', options: ['Emergency roadside', 'At my residence', 'Drive-in clinic'] }], a: 'lead', i: 'Match local vulcanizer' },
        { s: 'fuel_delivery', q: [{ q: 'Fuel type?', options: ['Petrol', 'Diesel', 'Kerosene'] }, { q: 'Litres?', options: [] }, { q: 'Your location?', options: [] }], a: 'lead', i: 'Dispatch fuel delivery provider' },

        // Payments & Products
        { s: 'bill_payment', q: [{ q: 'Select bill category', options: ['Electricity (IKEDC/EKEDC)', 'DSTV / GOTV', 'Water Utility', 'Internet Subscription'] }], a: 'trade', i: 'Process instant bill payment via reload engine' },
        { s: 'airtime_purchase', q: [{ q: 'Select network', options: ['MTN', 'Airtel', 'Glo', '9mobile', 'Vodafone', 'EE'] }], a: 'trade', i: 'Process direct mobile airtime pin' },
        { s: 'telco_promoter', q: [{ q: 'Select promo package', options: ['Fibre broadband sign-up', 'SIM card purchase with bundle', 'Postpaid upgrade'] }], a: 'affiliate', i: 'Match authorized network representative' },
        { s: 'phone_seller', q: [{ q: 'What type of phone?', options: ['Budget Android', 'Latest iPhone', 'Pre-owned Samsung', 'Feature phone'] }], a: 'trade', i: 'Source phone from vetted suppliers' },
        { s: 'electronics_seller', q: [{ q: 'Select electronics category', options: ['Smart TV', 'Home theatre', 'Power bank / Charger', 'Solar lamp'] }], a: 'trade', i: 'Source electronics with escrow' },
        { s: 'grocery_seller', q: [{ q: 'Select grocery basket', options: ['Cooking oil, spices, noodles', 'Cereal & milk pack', 'Soap, toiletries, cleaner'] }], a: 'trade', i: 'Source bulk groceries for swift delivery' },
        { s: 'farm_produce_seller', q: [{ q: 'Select farm produce', options: ['50kg bag of Rice', 'Tubers of Yam', 'Garri bag', 'Fresh Tomatoes & Peppers'] }], a: 'trade', i: 'Arbitrage query matches local agricultural supplier' },
        
        // --- UK Life-Admin Universal Skills (§35.2.1) ---
        { s: 'bin_day', q: [{ q: 'Enter your postcode', type: 'text' }], a: 'lead', i: 'Check your council public bin schedule using postcode.' },
        { s: 'mot_reminder', q: [{ q: 'Enter your vehicle registration', type: 'text' }], a: 'lead', i: 'Check MOT expiry with the DVLA using vehicle registration.' },
        { s: 'insurance_renewal', q: [{ q: 'Enter insurance policy details', type: 'text' }], a: 'lead', i: 'Remind when policy is due. No data shared without consent.' },
        { s: 'doctor_appointment', q: [{ q: 'Enter appointment date', type: 'text' }], a: 'appointment', i: 'Store appointment date/time to send reminders.' },
        { s: 'council_tax', q: [{ q: 'Enter postcode and current band', type: 'text' }], a: 'affiliate', i: 'Use public VOA data to check council tax band.' },
        { s: 'energy_tariff', q: [{ q: 'Enter postcode and energy usage', type: 'text' }], a: 'affiliate', i: 'Compare tariffs using postcode. Show affiliate links.' },
        { s: 'lost_pet', q: [{ q: 'Pet name, description, and last seen postcode', type: 'text' }], a: 'lead', i: 'Connect with people who find your pet safely.' },
        { s: 'skill_swap', q: [{ q: 'Skills offered and skills wanted', type: 'text' }], a: 'lead', i: 'Connect with neighbours for skill exchange.' },
        { s: 'parking_appeal', q: [{ q: 'Ticket details and images', type: 'text' }], a: 'lead', i: 'Generate an appeal template for parking tickets.' },
        { s: 'boiler_service', q: [{ q: 'Boiler type and last service date', type: 'text' }], a: 'affiliate', i: 'Remind when boiler is due. Connect local engineers.' },
        { s: 'warranty_tracker', q: [{ q: 'Product name and purchase date', type: 'text' }], a: 'lead', i: 'Store purchase details to alert when warranties expire.' },
        { s: 'moving_house', q: [{ q: 'Moving date and postcodes', type: 'text' }], a: 'affiliate', i: 'Generate checklist and connect removal services.' },
        { s: 'first_flat', q: [], a: 'lead', i: 'Step-by-step guide for new renters.' },
        { s: 'rental_tracker', q: [{ q: 'Property address and agent name', type: 'text' }], a: 'lead', i: 'Track applications and send reminders.' },
        { s: 'funeral_wishes', q: [{ q: 'Wishes text', type: 'text' }], a: 'lead', i: 'Store wishes securely. Not legally binding.' },
        { s: 'digital_executor', q: [{ q: 'Instructions', type: 'text' }], a: 'lead', i: 'Store digital legacy instructions. Encrypted.' },
        { s: 'bereavement_admin', q: [{ q: 'Deceased name', type: 'text' }], a: 'lead', i: 'Provide checklists and guidance.' },
        { s: 'street_party', q: [{ q: 'Street name and council', type: 'text' }], a: 'lead', i: 'Coordinate with neighbours and council.' },
        { s: 'borrowed_iou', q: [{ q: 'Item, borrower, return date', type: 'text' }], a: 'lead', i: 'Send reminders for borrowed items.' },
        { s: 'school_run', q: [{ q: 'School name, postcode, schedule', type: 'text' }], a: 'lead', i: 'Match nearby parents for carpooling.' },
        { s: 'babysitter', q: [{ q: 'Child age, date/time', type: 'text' }], a: 'lead', i: 'Connect with babysitters. Vetting required.' },
        { s: 'allotment_sitter', q: [{ q: 'Plot number and watering needs', type: 'text' }], a: 'lead', i: 'Coordinate watering and care for allotment.' },
        { s: 'pet_taxi', q: [{ q: 'Pet type and vet address', type: 'text' }], a: 'affiliate', i: 'Arrange shared pet transport.' },
        { s: 'micro_volunteer', q: [{ q: 'Interests', type: 'text' }], a: 'lead', i: 'Suggest local volunteering opportunities.' },
        { s: 'pride_events', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'List upcoming Pride events near you.' },
        { s: 'right_to_roam', q: [{ q: 'Postcode and route', type: 'text' }], a: 'lead', i: 'Notify about access rights on routes near you.' },
        { s: 'flood_line', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'Send Environment Agency flood warnings.' },
        { s: 'swep_alert', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'Alert when Severe Weather Emergency Protocols activated.' },
        { s: 'running_beacon', q: [{ q: 'Emergency contact and route', type: 'text' }], a: 'lead', i: 'Emergency contact notified if you dont check in.' },
        { s: 'night_walk', q: [{ q: 'Emergency contact and route', type: 'text' }], a: 'lead', i: 'Similar to Running Beacon for night walks.' },
        { s: 'couch_to_5k', q: [], a: 'lead', i: 'Send weekly running plans.' },
        { s: 'sketch_prompt', q: [], a: 'lead', i: 'Send a daily drawing prompt.' },
        { s: 'word_of_day', q: [{ q: 'Language', type: 'text' }], a: 'lead', i: 'Send a new word in chosen language daily.' },
        { s: 'creative_block', q: [], a: 'lead', i: 'Send creative exercises.' },
        { s: 'digital_declutter', q: [], a: 'lead', i: 'Guide through a digital detox weekend.' },
        { s: 'inbox_zero', q: [], a: 'lead', i: 'Send prompts to clear your inbox.' },
        { s: 'side_hustle', q: [{ q: 'Goal', type: 'text' }], a: 'lead', i: 'Check in on side-project progress.' },
        { s: 'job_tracker', q: [{ q: 'Company, role, deadline', type: 'text' }], a: 'lead', i: 'Track applications and send reminders.' },
        { s: 'retirement_coach', q: [{ q: 'Retirement date', type: 'text' }], a: 'lead', i: 'Provide retirement planning reminders.' },
        { s: 'sleep_tracker', q: [{ q: 'Sleep hours', type: 'text' }], a: 'lead', i: 'Log sleep hours and remind to catch up.' },
        { s: 'energy_logger', q: [{ q: 'Energy level', type: 'text' }], a: 'lead', i: 'Track daily energy levels.' },
        { s: 'pet_weight', q: [{ q: 'Pet weight', type: 'text' }], a: 'lead', i: 'Remind when to weigh your pet.' },
        { s: 'sad_lamp', q: [], a: 'lead', i: 'Remind to use SAD lamp in darker months.' },
        { s: 'carer_break', q: [], a: 'lead', i: 'Nudge carers to take regular breaks.' },
        { s: 'car_boot', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'List upcoming car boot sales near you.' },
        { s: 'museum_quiet', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'List quiet hours at museums.' },
        { s: 'urban_explorer', q: [{ q: 'City', type: 'text' }], a: 'lead', i: 'Suggest urban exploration routes.' },
        { s: 'charity_shop', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'Find charity shops near you.' },
        { s: 'farm_shop', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'Remind of farm shop times and deals.' },
        { s: 'vinyl_wantlist', q: [{ q: 'Album and artist', type: 'text' }], a: 'affiliate', i: 'Track wishlist and alert when copy appears.' },
        { s: 'genealogy', q: [{ q: 'Ancestor name', type: 'text' }], a: 'lead', i: 'Send weekly genealogy research prompts.' },
        { s: 'accessibility', q: [{ q: 'Venue name', type: 'text' }], a: 'lead', i: 'Check venue accessibility details.' },
        { s: 'walking_group', q: [{ q: 'Postcode', type: 'text' }], a: 'lead', i: 'Help find or start a walking group near you.' },
        { s: 'ev_charging', q: [{ q: 'Postcode', type: 'text' }], a: 'affiliate', i: 'Find EV charging point availability.' },
        { s: 'taxi_quick', q: [{ q: 'Pickup and dropoff', type: 'text' }], a: 'lead', i: 'Book a taxi via partner apps.' },
        { s: 'train_check', q: [{ q: 'Origin, destination, date', type: 'text' }], a: 'affiliate', i: 'Check live train times and delays.' },
        { s: 'flight_alert', q: [{ q: 'Route and dates', type: 'text' }], a: 'affiliate', i: 'Alert when flight prices drop.' },
        { s: 'food_nearby', q: [{ q: 'Postcode and cuisine', type: 'text' }], a: 'affiliate', i: 'List nearby restaurants.' },
        { s: 'grocery_reminder', q: [{ q: 'Shopping list', type: 'text' }], a: 'lead', i: 'Remind when to buy groceries.' },
        { s: 'event_finder', q: [{ q: 'City and dates', type: 'text' }], a: 'affiliate', i: 'Find local events.' },
        { s: 'parking_spot', q: [{ q: 'Location', type: 'text' }], a: 'affiliate', i: 'Find and reserve parking.' },
        { s: 'hotel_deals', q: [{ q: 'City and dates', type: 'text' }], a: 'affiliate', i: 'Send hotel deals.' },
        { s: 'gift_finder', q: [{ q: 'Occasion and budget', type: 'text' }], a: 'affiliate', i: 'Suggest gifts and send store links.' }
    ];

    for (const s of skillsList) {
        database.run(`INSERT OR IGNORE INTO skill_flows (skill, question_set, post_match_action, payment_model, fulfillment_instructions) VALUES (?, ?, ?, ?, ?)`, [
            s.s,
            JSON.stringify(s.q),
            s.a,
            'credits',
            s.i
        ]);
    }
}

export function seedDemoProviders(database: any) {
    const cities = ['Ibadan', 'London', 'Accra'];
    const countries = ['ng'];
    const skills = [
        'plumber', 'electrician', 'mechanic', 'carpenter', 'painter', 'welder', 'tailor',
        'baker', 'caterer', 'photographer', 'videographer', 'makeup_artist', 'barber', 'hairdresser',
        'cleaner', 'laundry', 'gardener', 'pest_control', 'security_guard', 'driver', 'dispatch_rider',
        'tutor', 'nanny', 'nurse', 'doctor', 'pharmacist', 'lab_technician', 'fitness_trainer',
        'yoga_instructor', 'massage_therapist', 'pet_groomer', 'veterinarian', 'dj', 'musician',
        'event_planner', 'decorator', 'mason', 'roofing_expert', 'solar_installer',
        'generator_repair', 'phone_repair', 'laptop_repair', 'appliance_repair', 'shoe_maker',
        'fashion_designer', 'graphic_designer', 'web_developer', 'content_writer', 'translator',
        'legal_consultant', 'accountant', 'tax_advisor', 'real_agent', 'interior_designer',
        'pool_cleaner', 'car_wash', 'fumigation', 'moving_help', 'masonry', 'welding',
        'delivery', 'rider', 'caterer', 'it_support'
    ];

    for (let i = 1; i <= 79; i++) {
        const phone = `+${i % 2 === 0 ? '234' : i % 3 === 0 ? '44' : '233'}80${String(i).padStart(8, '0')}`;
        const name = `Provider Name ${i}`;
        const location = cities[i % cities.length];
        const country = countries[i % countries.length];
        const skill = skills[i % skills.length];

        database.run(`INSERT OR IGNORE INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, is_available) VALUES (?, ?, ?, ?, 'Plus', 200, 1)`, [phone, name, location, country]);
        database.run(`INSERT OR IGNORE INTO skills (phone, skill, source, confidence, is_available, operation_mode, hourly_rate, rating, jobs_completed) VALUES (?, ?, 'explicit', 1.0, 1, 'mobile', 2500, 4.8, 15)`, [phone, skill]);
    }
}

export function seedNigerianProviders(database: any) {
    const states = [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
        'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
        'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
        'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ];
    const categories = [
        'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic', 'Baker', 'Tailor',
        'Photographer', 'Cleaner', 'Tutor'
    ];

    for (const state of states) {
        // Approximate center lat/lng for Nigeria to simulate locations
        const baseLat = 9.0;
        const baseLng = 8.0;
        
        for (let i = 1; i <= 10; i++) {
            const phone = `+234${Math.floor(100000000 + Math.random() * 900000000)}`;
            const name = `Real Provider ${state} ${i}`;
            const category = categories[i % categories.length];
            const skill = category.toLowerCase().replace(' ', '_');
            
            // Randomize slightly around base coordinates
            const lat = baseLat + (Math.random() - 0.5) * 5;
            const lng = baseLng + (Math.random() - 0.5) * 5;

            database.run(`INSERT OR IGNORE INTO memory_profiles (phone, name, location, primary_state, country, subscription_tier, wallet_balance_minor, is_available) VALUES (?, ?, ?, ?, 'ng', 'Plus', 200, 1)`, [phone, name, state, state]);
            database.run(`INSERT OR IGNORE INTO skills (phone, skill, source, confidence, is_available, operation_mode, hourly_rate, rating, jobs_completed) VALUES (?, ?, 'explicit', 1.0, 1, 'stationary', 3000, 4.5, 5)`, [phone, skill]);
            database.run(`INSERT OR IGNORE INTO provider_presence (phone, is_live, operation_mode, last_lat, last_lng) VALUES (?, 1, 'stationary', ?, ?)`, [phone, lat, lng]);
        }
    }
}

export function auditAppointmentSkillFlows(database: any) {
    const skillFlowsResult = database.exec("PRAGMA table_info(skill_flows)");
    if (skillFlowsResult && skillFlowsResult.length > 0 && skillFlowsResult[0].values) {
        const cols = skillFlowsResult[0].values.map((col: any) => col[1]);
        if (!cols.includes('booking_mode')) {
            database.run("ALTER TABLE skill_flows ADD COLUMN booking_mode TEXT DEFAULT 'instant'");
        }
    }

    const appointmentSkills = [
        'doctor', 'dentist', 'physiotherapist', 'nurse', 'pharmacist',
        'hairdresser', 'barber', 'makeup_artist', 'personal_trainer', 'yoga_instructor',
        'tutor', 'music_teacher', 'driving_instructor', 'photographer', 'videographer',
        'dj', 'mc', 'event_planner', 'mechanic', 'plumber',
        'lawyer', 'accountant', 'consultant', 'therapist', 'counsellor',
        'car_wash', 'tyre_repair', 'vulcanizer'
    ];

    const dateTimeQuestion = { q: "What date and time would you like for your appointment?", options: [], type: "text" };

    for (const skill of appointmentSkills) {
        const stmt = database.prepare("SELECT * FROM skill_flows WHERE skill = ?");
        stmt.bind([skill]);
        let existing: any = null;
        if (stmt.step()) {
            existing = stmt.getAsObject();
        }
        stmt.free();

        if (!existing) {
            const qSet = JSON.stringify([
                { q: `What service or details do you need for ${skill.replace(/_/g, ' ')}?`, options: [], type: "text" },
                dateTimeQuestion
            ]);
            database.run(
                `INSERT INTO skill_flows (skill, question_set, post_match_action, payment_model, fulfillment_instructions, booking_mode) VALUES (?, ?, 'appointment', 'lead_fee', 'chat_only', 'appointment')`,
                [skill, qSet]
            );
        } else {
            let qArray: any[] = [];
            try {
                qArray = JSON.parse(existing.question_set || '[]');
            } catch (e) {
                qArray = [];
            }
            const hasDateTime = qArray.some((qObj: any) => {
                const text = (qObj.q || qObj.question || '').toLowerCase();
                return text.includes('date') || text.includes('time') || text.includes('when');
            });

            if (!hasDateTime) {
                qArray.push(dateTimeQuestion);
            }

            database.run(
                `UPDATE skill_flows SET booking_mode = 'appointment', post_match_action = 'appointment', question_set = ? WHERE skill = ?`,
                [JSON.stringify(qArray), skill]
            );
        }
    }

    const countStmt = database.prepare("SELECT COUNT(*) as count FROM skill_flows WHERE booking_mode = 'appointment' OR post_match_action = 'appointment'");
    let count = 0;
    if (countStmt.step()) {
        count = countStmt.getAsObject().count;
    }
    countStmt.free();

    console.log(`Appointment‑ready skill flows: ${count}`);
    return count;
}

export async function searchUserMessages(phone: string, keyword: string): Promise<any[]> {
    const database = await getDb();
    const stmt = database.prepare(`
        SELECT * FROM messages 
        WHERE phone = ? AND content LIKE ? 
        ORDER BY id DESC
    `);
    stmt.bind([phone, `%${keyword}%`]);
    const results: any[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

export async function searchMessagesByKeyword(phone: string, keyword: string): Promise<any[]> {
    return searchUserMessages(phone, keyword);
}

export async function purgeExpiredData(): Promise<{ messagesDeleted: number; tempSessionsDeleted: number; pulseLocationsDeleted: number }> {
    const database = await getDb();
    
    // 1. Messages older than 12 months (365 days)
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM messages WHERE created_at < ?`, [twelveMonthsAgo]);
    const messagesDeleted = database.getRowsModified();

    // 2. Temp sessions older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM temp_sessions WHERE created_at < ?`, [sevenDaysAgo]);
    const tempSessionsDeleted = database.getRowsModified();

    // 3. Pulse sessions location data older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    database.run(`DELETE FROM pulse_sessions WHERE expires_at < ? OR (expires_at IS NULL AND id IN (SELECT id FROM pulse_sessions WHERE id NOT IN (SELECT id FROM pulse_sessions ORDER BY id DESC LIMIT 100)))`, [thirtyDaysAgo]);
    const pulseLocationsDeleted = database.getRowsModified();

    // 4. Provider presence records inactive for over 30 days
    try {
        database.run(`DELETE FROM provider_presence WHERE updated_at < ? AND is_live = 0`, [thirtyDaysAgo]);
    } catch (e) {}

    // Also purge audit logs older than 30 days
    try {
        database.run(`DELETE FROM audit_logs WHERE created_at < ?`, [thirtyDaysAgo]);
    } catch (e) {}

    saveDb();

    console.log(`[Database Purge] Data retention completed. Messages: ${messagesDeleted}, Temp sessions: ${tempSessionsDeleted}, Pulse locations: ${pulseLocationsDeleted} deleted.`);

    return { messagesDeleted, tempSessionsDeleted, pulseLocationsDeleted };
}

export async function updateProviderPresence(presence: {
    phone: string;
    is_live?: boolean | number;
    operation_mode?: string;
    last_lat?: number;
    last_lng?: number;
    fuzzed_radius_m?: number;
    live_until?: string;
}): Promise<void> {
    const database = await getDb();
    const isLive = presence.is_live ? 1 : 0;
    const now = new Date().toISOString();
    
    const existingStmt = database.prepare("SELECT phone FROM provider_presence WHERE phone = ?");
    existingStmt.bind([presence.phone]);
    const exists = existingStmt.step();
    existingStmt.free();

    if (exists) {
        database.run(`
            UPDATE provider_presence SET
                is_live = COALESCE(?, is_live),
                operation_mode = COALESCE(?, operation_mode),
                last_lat = COALESCE(?, last_lat),
                last_lng = COALESCE(?, last_lng),
                fuzzed_radius_m = COALESCE(?, fuzzed_radius_m),
                live_until = COALESCE(?, live_until),
                last_confirmed = ?,
                updated_at = ?
            WHERE phone = ?
        `, [
            presence.is_live !== undefined ? isLive : null,
            presence.operation_mode || null,
            presence.last_lat !== undefined ? presence.last_lat : null,
            presence.last_lng !== undefined ? presence.last_lng : null,
            presence.fuzzed_radius_m !== undefined ? presence.fuzzed_radius_m : null,
            presence.live_until || null,
            now,
            now,
            presence.phone
        ]);
    } else {
        database.run(`
            INSERT INTO provider_presence (phone, is_live, operation_mode, last_lat, last_lng, fuzzed_radius_m, live_until, last_confirmed, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            presence.phone,
            isLive,
            presence.operation_mode || 'stationary',
            presence.last_lat || null,
            presence.last_lng || null,
            presence.fuzzed_radius_m || 100,
            presence.live_until || null,
            now,
            now
        ]);
    }
    saveDb();
}

export async function getProviderPresence(phone: string): Promise<any | null> {
    const database = await getDb();
    const stmt = database.prepare("SELECT * FROM provider_presence WHERE phone = ?");
    stmt.bind([phone]);
    let result = null;
    if (stmt.step()) {
        result = stmt.getAsObject();
    }
    stmt.free();
    return result;
}

export async function recordBehaviorSignal(signal: {
    phone: string;
    signal_type: string;
    key: string;
    value: any;
    strength?: number;
}): Promise<void> {
    const database = await getDb();
    const valueStr = typeof signal.value === 'object' ? JSON.stringify(signal.value) : String(signal.value);
    const strengthVal = signal.strength !== undefined ? signal.strength : 0.5;
    const now = new Date().toISOString();

    database.run(`
        INSERT INTO user_behavior_signals (phone, signal_type, key, value, strength, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [signal.phone, signal.signal_type, signal.key, valueStr, strengthVal, now, now]);

    saveDb();
}

export async function getUserBehaviorSignals(phone: string, signalType?: string): Promise<any[]> {
    const database = await getDb();
    let query = "SELECT * FROM user_behavior_signals WHERE phone = ?";
    const params: any[] = [phone];
    if (signalType) {
        query += " AND signal_type = ?";
        params.push(signalType);
    }
    query += " ORDER BY id DESC LIMIT 50";

    const stmt = database.prepare(query);
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        try {
            row.value = JSON.parse(row.value);
        } catch (e) {}
        results.push(row);
    }
    stmt.free();
    return results;
}

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
    const database = await getDb();
    const stmt = database.prepare("SELECT value FROM system_settings WHERE key = ?");
    stmt.bind([key]);
    let val = defaultValue;
    if (stmt.step()) {
        const row = stmt.getAsObject();
        val = row.value !== undefined ? String(row.value) : defaultValue;
    }
    stmt.free();
    return val;
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
    const database = await getDb();
    database.run("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)", [key, value]);
    saveDb();
}

