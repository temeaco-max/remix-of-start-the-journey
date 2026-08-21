const DEMO_SEED_VERSION = '2026-08-21-webapp-v2';

/** Development-only, idempotent demo data for the canonical operator account. */
export function seedDemoWorkspaceState(database: any, operatorPhone: string): void {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
  if (String(process.env.KURUKOO_DEMO_DATA || 'true').toLowerCase() === 'false') return;

  const marker = database.exec('SELECT value FROM system_settings WHERE key=?', ['demo_workspace_seed_version']);
  if (marker[0]?.values?.length && String(marker[0].values[0][0]) === DEMO_SEED_VERSION) return;

  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const providerPhone = '+2348000000102';
  const sellerPhone = '+2348000000103';
  const contributorPhone = '+2348000000104';
  const deliveryPhone = '+2348000000113';

  database.run(`CREATE TABLE IF NOT EXISTS saved_items (id TEXT PRIMARY KEY,phone TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'context',title TEXT NOT NULL,description TEXT,source_url TEXT,source_id TEXT,metadata TEXT DEFAULT '{}',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(phone,kind,source_id))`);
  database.run(`CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY,phone TEXT NOT NULL,offer_id TEXT NOT NULL,title TEXT NOT NULL,seller TEXT,quantity INTEGER NOT NULL DEFAULT 1,price_minor INTEGER,currency TEXT DEFAULT 'NGN',source TEXT,provenance TEXT,external_url TEXT,media_reference TEXT,request_id TEXT,status TEXT DEFAULT 'review',created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(phone,offer_id))`);
  database.run(`CREATE TABLE IF NOT EXISTS economic_offers (id TEXT PRIMARY KEY,request_id TEXT NOT NULL UNIQUE,seller_phone TEXT NOT NULL,description TEXT NOT NULL,price_minor INTEGER,currency TEXT DEFAULT 'NGN',source TEXT NOT NULL,availability_note TEXT,external_source TEXT,status TEXT DEFAULT 'available',provenance TEXT DEFAULT 'seller_created',media_reference TEXT,external_url TEXT,origin_offer_id TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

  const providers = [
    [providerPhone, 'Adebayo Repairs', 'device-repair', 4.9, 126],
    ['+2348000000112', 'Ifeoma Home Services', 'home-cleaning', 4.8, 93],
    [deliveryPhone, 'Chinedu Logistics', 'delivery', 4.7, 214],
  ];
  for (const [phone, name, skill, rating, jobs] of providers) {
    database.run(`INSERT OR IGNORE INTO memory_profiles (phone,name,location,primary_lga,country,subscription_tier,points_balance,wallet_balance_minor,preferences,behavior_patterns,is_available,is_contributor,verified_provider,provider_type,trust_score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [phone, name, 'Ikeja', 'Ikeja', 'ng', 'Pro', 280, 1500, JSON.stringify({ demo_seed: true }), '{}', 1, 1, 1, 'human', rating]);
    database.run(`UPDATE memory_profiles SET name=?,is_available=1,verified_provider=1,trust_score=? WHERE phone=?`, [name, rating, phone]);
    database.run(`INSERT OR IGNORE INTO skills (phone,skill,is_available,hourly_rate,rating,jobs_completed,equipment,service_radius_km,pricing_model,booking_mode) VALUES (?,?,?,?,?,?,?,?,?,?)`, [phone, skill, 1, 6500, rating, jobs, JSON.stringify(['standard equipment']), 18, 'fixed', 'instant']);
    database.run(`INSERT OR REPLACE INTO provider_presence (phone,is_live,operation_mode,last_lat,last_lng,fuzzed_radius_m,live_until,last_confirmed,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, [phone, 1, 'stationary', 6.6018, 3.3515, 500, iso(6 * 60 * 60 * 1000), iso(0), iso(0)]);
  }

  const requests = [
    ['demo-req-101', 'Laptop repair', 'repair', 'matching', { device: 'MacBook Pro 14-inch', issue: 'screen flicker', urgency: 'this week' }, providerPhone, { amount_minor: 45000, currency: 'NGN', status: 'proposed' }, { stage: 'provider_discovery', evidence: ['verified provider profile'] }],
    ['demo-req-102', 'Home cleaning', 'home_service', 'requested', { property: '2-bedroom flat', area: 'Ikeja', preferred_window: 'Saturday morning' }, null, null, null],
    ['demo-req-103', 'Replacement laptop charger', 'shopping', 'quoted', { product: 'USB-C 96W charger', compatibility: 'MacBook Pro 14-inch' }, sellerPhone, { amount_minor: 28500, currency: 'NGN', status: 'quoted' }, { stage: 'quote_review', evidence: ['seller offer', 'price timestamp'] }],
    ['demo-req-104', 'Document delivery across Lagos', 'delivery', 'in_progress', { pickup: 'Ikeja', dropoff: 'Yaba', package: 'document envelope' }, deliveryPhone, { amount_minor: 7500, currency: 'NGN', status: 'accepted' }, { stage: 'collection', evidence: ['provider confirmed'] }],
    ['demo-req-105', 'Apartment cleaning', 'home_service', 'fulfilled', { property: '2-bedroom flat', date: '2026-08-18' }, '+2348000000112', { amount_minor: 18000, currency: 'NGN', status: 'settled' }, { stage: 'fulfilled', evidence: ['completion confirmed', 'user rating recorded'] }],
    ['demo-req-106', 'Cheaper phone plan', 'telecom', 'cancelled', { monthly_budget_minor: 12000, data_gb: 20 }, null, null, { stage: 'cancelled_by_user', reason: 'No suitable option found' }],
  ];
  for (const [id, skill, category, status, requirements, provider, quote, fulfillment] of requests) {
    database.run(`INSERT OR IGNORE INTO economic_requests (id,phone,skill,category,status,requirements_json,capabilities_json,provider_phone,quote_json,fulfillment_json) VALUES (?,?,?,?,?,?,?,?,?,?)`, [id, operatorPhone, skill, category, status, JSON.stringify(requirements), JSON.stringify(['verify_provider', 'maintain_conversation_continuity']), provider, quote ? JSON.stringify(quote) : null, fulfillment ? JSON.stringify(fulfillment) : null]);
  }

  const offers = [
    ['demo-offer-201', 'demo-req-101', providerPhone, 'MacBook Pro screen diagnostic + repair', 45000, 'Adebayo Repairs', 'Verified provider · quote valid for 48 hours'],
    ['demo-offer-202', 'demo-req-103', sellerPhone, 'USB-C 96W compatible charger', 28500, 'Ikeja Tech Seller', 'Available now · local fulfilment'],
  ];
  for (const [id, requestId, seller, description, price, source, availability] of offers) {
    database.run(`INSERT OR IGNORE INTO economic_offers (id,request_id,seller_phone,description,price_minor,currency,source,availability_note,status,provenance) VALUES (?,?,?,?,?,?,?,?,?,?)`, [id, requestId, seller, description, price, 'NGN', source, availability, 'available', 'seller_created']);
  }

  const cart = [
    ['demo-cart-301', 'demo-offer-202', 'USB-C 96W compatible charger', sellerPhone, 1, 28500, 'demo-req-103'],
    ['demo-cart-302', 'demo-offer-203', 'Laptop sleeve · 14-inch', sellerPhone, 1, 17500, null],
  ];
  for (const [id, offerId, title, seller, quantity, price, requestId] of cart) {
    database.run(`INSERT OR IGNORE INTO cart_items (id,phone,offer_id,title,seller,quantity,price_minor,currency,source,provenance,request_id,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id, operatorPhone, offerId, title, seller, quantity, price, 'NGN', 'demo_catalogue', 'seller_created', requestId, 'review']);
  }

  const saved = [
    ['demo-saved-401', 'topic', 'How to choose a trustworthy repair provider in Lagos', 'Verification, evidence, availability and quote checklist.', '/topics/trustworthy-repair-providers', 'demo-topic-401'],
    ['demo-saved-402', 'provider', 'Adebayo Repairs', 'Verified device-repair provider with strong review history.', '/chat?prompt=Tell%20me%20about%20Adebayo%20Repairs', providerPhone],
    ['demo-saved-403', 'offer', 'USB-C 96W compatible charger', 'Saved from the review cart for later comparison.', '/cart', 'demo-offer-202'],
    ['demo-saved-404', 'memory', 'Preferred communication style', 'Short answers, clear next actions, minimal repetition.', '/memory', 'demo-memory-style'],
  ];
  for (const [id, kind, title, description, sourceUrl, sourceId] of saved) {
    database.run(`INSERT OR IGNORE INTO saved_items (id,phone,kind,title,description,source_url,source_id,metadata) VALUES (?,?,?,?,?,?,?,?)`, [id, operatorPhone, kind, title, description, sourceUrl, sourceId, JSON.stringify({ demo_seed: true })]);
  }

  const reminders = [
    ['demo-rem-501', 'Compare the repair quotes', 'Review the verified MacBook repair quote before Friday.', 24 * 60 * 60 * 1000, 'scheduled'],
    ['demo-rem-502', 'Follow up on charger order', 'Check the delivery estimate if the offer is still in cart.', 48 * 60 * 60 * 1000, 'scheduled'],
    ['demo-rem-503', 'Review weekly task list', 'Desk review: close completed tasks and reschedule anything blocked.', 3 * 60 * 60 * 1000, 'scheduled'],
    ['demo-rem-504', 'Completed demo reminder', 'Historical reminder used to exercise completed state.', -48 * 60 * 60 * 1000, 'completed'],
  ];
  for (const [id, title, note, offset, status] of reminders) {
    database.run(`INSERT OR IGNORE INTO reminders (id,phone,title,note,due_at,status) VALUES (?,?,?,?,?,?)`, [id, operatorPhone, title, note, iso(Number(offset)), status]);
  }

  const notifications = [
    ['Request updated', 'Your MacBook repair request has a new verified quote to review.', '/requests/demo-req-101', 'unread'],
    ['Reminder due soon', 'Compare the repair quotes is due soon.', '/reminders', 'unread'],
    ['Provider confirmed', 'Chinedu Logistics confirmed document collection.', '/requests/demo-req-104', 'unread'],
    ['Saved item added', 'The repair verification checklist was saved for later.', '/saved', 'read'],
    ['Topic reply', 'A new reply was posted to a Topic you saved.', '/topics/trustworthy-repair-providers', 'unread'],
    ['Task completed', 'Your contributed task was marked as verified.', '/tasks', 'read'],
  ];
  for (const [title, body, link, status] of notifications) {
    database.run(`INSERT OR IGNORE INTO internal_notifications (phone,title,body,link,status,delivery_state) VALUES (?,?,?,?,?,?)`, [operatorPhone, title, body, link, status, 'delivered']);
  }

  const goals = [
    ['demo-goal-601', 'Find and compare a verified laptop repair option', 'active', 10, 'assist'],
    ['demo-goal-602', 'Keep my Saturday home service arranged', 'paused', 30, 'confirm'],
    ['demo-goal-603', 'Monitor the document delivery until completion', 'active', 20, 'assist'],
    ['demo-goal-604', 'Find a cheaper mobile plan', 'completed', 60, 'assist'],
  ];
  for (const [id, objective, status, priority, autonomy] of goals) {
    database.run(`INSERT OR IGNORE INTO agent_goals (id,phone,conversation_id,source,goal_type,objective,status,priority,autonomy,risk_level,confirmation_required,summary,plan_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, operatorPhone, 'operator-seeded-conversation', 'demo_seed', 'user_goal', objective, status, priority, autonomy, 'read_only', autonomy === 'confirm' ? 1 : 0, 'Controlled demo goal for Desk/Agent states.', JSON.stringify({ demo: true, steps: ['interpret', 'clarify_if_needed', 'propose', 'execute_only_when_authorized'] })]);
  }

  const messages = [
    ['user', 'I need my MacBook screen checked this week. Can you find a verified repairer?'],
    ['assistant', 'I found a verified repair option in Ikeja and a quote is ready to review. I have not booked anything.'],
    ['user', 'Keep that on my list. I also need a cleaner for Saturday morning.'],
    ['assistant', 'Done. I’m keeping both needs separate so each request can have its own provider, quote and evidence.'],
    ['user', 'What was the charger you found for me?'],
    ['assistant', 'A USB-C 96W compatible charger is in your review cart at NGN 28,500. Payment has not been taken.'],
    ['user', 'Actually, focus on the delivery first.'],
    ['assistant', 'Understood. I’ll keep the other items in place and focus this conversation on the document delivery.'],
  ];
  for (const [sender, content] of messages) {
    database.run(`INSERT INTO messages (phone,sender,content,channel,card_data) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM messages WHERE phone=? AND content=?)`, [operatorPhone, sender, content, 'web', JSON.stringify({ type: 'demo_seed', clearlySeeded: true }), operatorPhone, content]);
  }

  const topics = [
    ['demo-topic-401', 'trustworthy-repair-providers', contributorPhone, 'How to choose a trustworthy repair provider in Lagos', 'A practical checklist for verifying skills, evidence, availability and quote boundaries before you confirm work.', 'guidance'],
    ['demo-topic-402', 'safe-home-services', contributorPhone, 'What good home-service handover looks like', 'Useful questions about arrival windows, scope, evidence and completion before service begins.', 'guidance'],
    ['demo-topic-403', 'small-business-tools', contributorPhone, 'Useful tools for small businesses in Lagos', 'A community-curated discussion of everyday services and tools without over-claiming verification.', 'discussion'],
  ];
  for (const [id, slug, author, title, body, type] of topics) {
    database.run(`INSERT OR IGNORE INTO topics (id,slug,author_phone,title,body,type,category,status,published_at) VALUES (?,?,?,?,?,?,?,?,?)`, [id, slug, author, title, body, type, 'community', 'public', iso(-24 * 60 * 60 * 1000)]);
  }

  const microTasks = [
    ['Verify a local provider profile', 'Check identity, capability and evidence fields.', 'trust', 25],
    ['Review a delivery completion photo', 'Check whether evidence supports the fulfilment claim.', 'evidence', 35],
    ['Classify a community Topic', 'Assign the most useful taxonomy label.', 'content', 15],
  ];
  for (const [title, description, skillTag, reward] of microTasks) {
    const exists = database.exec('SELECT id FROM micro_tasks WHERE title=? AND source_type=?', [title, 'demo_seed']);
    if (!exists[0]?.values?.length) database.run(`INSERT INTO micro_tasks (title,description,skill_tag,credits_reward,status,source_type,source_id,verification_kind) VALUES (?,?,?,?,?,?,?,?)`, [title, description, skillTag, reward, 'available', 'demo_seed', `demo-${skillTag}`, 'manual_review']);
  }

  for (const [key, value] of [
    ['demo_workspace_seed_version', DEMO_SEED_VERSION],
    ['demo_workspace_seeded_for', operatorPhone],
    ['demo_workspace_seeded_at', new Date().toISOString()],
  ]) database.run('INSERT OR REPLACE INTO system_settings (key,value) VALUES (?,?)', [key, value]);
}

export const DEMO_WORKSPACE_SEED_VERSION = DEMO_SEED_VERSION;
