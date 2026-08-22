import { randomUUID } from 'crypto';
import { getCanonicalPersistenceMode } from './canonicalPersistence.js';
import { getCanonicalStore } from './canonicalStore.js';
import { classifyMessageTier, ensureLivingMemorySchema } from './livingMemoryEngine.js';
import { getProfile } from './memoryProfile.js';

export interface ChatMessageInput {
  phone: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  channel?: string;
  conversationId?: string;
  cardData?: unknown;
  metadata?: unknown;
}
export interface ChatHistoryOptions {
  conversationId?: string;
  limit?: number;
  beforeId?: number;
}

export async function ensureChatSchema(): Promise<void> {
  const store = await getCanonicalStore();
  await store.run(`CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    title TEXT,
    channel TEXT DEFAULT 'unified',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await store.run(`CREATE INDEX IF NOT EXISTS idx_chat_conversations_phone_updated ON chat_conversations(phone, updated_at DESC)`);
  await store.run(`CREATE TABLE IF NOT EXISTS chat_message_meta (
    message_id INTEGER PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    metadata TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await store.run(`CREATE INDEX IF NOT EXISTS idx_chat_meta_conversation ON chat_message_meta(conversation_id, message_id DESC)`);
  await store.run(`CREATE TABLE IF NOT EXISTS chat_attachments (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    message_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL
  )`);
  await store.run(`CREATE INDEX IF NOT EXISTS idx_chat_attachments_owner_expiry ON chat_attachments(phone, expires_at)`);
  try { await ensureLivingMemorySchema(); } catch { /* non-fatal at boot */ }
}

async function dbReady() {
  await ensureChatSchema();
  return getCanonicalStore();
}

export async function ensureConversation(phone: string, conversationId?: string, channel = 'unified', title?: string, createNew = false): Promise<string> {
  const store = await dbReady();
  if (conversationId) {
    const exists = await store.one<{ id: string }>(`SELECT id FROM chat_conversations WHERE id = ? AND phone = ?`, [conversationId, phone]);
    if (exists) return conversationId;
  }
  if (createNew) {
    const id = randomUUID();
    await store.run(`INSERT INTO chat_conversations (id, phone, title, channel) VALUES (?, ?, ?, ?)`, [id, phone, title || null, channel || 'unified']);
    return id;
  }
  const latest = await store.one<{ id: string }>(`SELECT id FROM chat_conversations WHERE phone = ? ORDER BY updated_at DESC LIMIT 1`, [phone]);
  if (latest?.id) {
    await store.run(`UPDATE chat_conversations SET channel = 'unified', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND phone = ?`, [latest.id, phone]);
    return String(latest.id);
  }
  const id = randomUUID();
  await store.run(`INSERT INTO chat_conversations (id, phone, title, channel) VALUES (?, ?, ?, 'unified')`, [id, phone, title || null]);
  return id;
}

export async function appendChatMessage(input: ChatMessageInput): Promise<{ id: number; conversationId: string }> {
  const store = await dbReady();
  await getProfile(input.phone, 'chatConversation');
  const conversationId = await ensureConversation(input.phone, input.conversationId, 'unified', input.sender === 'user' ? input.content.slice(0, 80) : undefined, input.sender === 'user' && !input.conversationId && ['web', 'web_qr'].includes(input.channel || 'web'));
  const params = [input.phone, input.sender, input.content, input.channel || 'web', input.cardData == null ? null : JSON.stringify(input.cardData), conversationId];
  let id = 0;
  if (getCanonicalPersistenceMode() === 'postgres') {
    const row = await store.insert<{ id: number }>(`INSERT INTO messages (phone, sender, content, channel, card_data, memory_tier, memory_status, relevance_score, thread_id) VALUES (?, ?, ?, ?, ?, 'episodic', 'active', 0.55, ?) RETURNING id`, params);
    id = Number(row?.id || 0);
  } else {
    await store.run(`INSERT INTO messages (phone, sender, content, channel, card_data, memory_tier, memory_status, relevance_score, thread_id) VALUES (?, ?, ?, ?, ?, 'episodic', 'active', 0.55, ?)`, params);
    const row = await store.one<{ id: number }>(`SELECT last_insert_rowid() AS id`);
    id = Number(row?.id || 0);
  }
  await store.run(`INSERT INTO chat_message_meta (message_id, conversation_id, metadata) VALUES (?, ?, ?) ON CONFLICT(message_id) DO UPDATE SET conversation_id = excluded.conversation_id, metadata = excluded.metadata`, [id, conversationId, input.metadata == null ? null : JSON.stringify(input.metadata)]);
  await store.run(`UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP, title = CASE WHEN title IS NULL AND ? = 'user' THEN ? ELSE title END WHERE id = ? AND phone = ?`, [input.sender, input.content.slice(0, 80), conversationId, input.phone]);
  if (id > 0) { try { await classifyMessageTier(id, 'episodic'); } catch {} }
  return { id, conversationId };
}

export async function listChatConversations(phone: string, limit = 50): Promise<any[]> {
  const store = await dbReady();
  return store.all(`SELECT id, phone, title, channel, created_at, updated_at FROM chat_conversations WHERE phone = ? ORDER BY updated_at DESC LIMIT ?`, [phone, Math.min(Math.max(limit, 1), 100)]);
}

export async function listChatMessages(phone: string, options: ChatHistoryOptions = {}): Promise<any[]> {
  const store = await dbReady();
  const limit = Math.min(Math.max(options.limit || 50, 1), 100);
  const params: any[] = [phone];
  let sql = `SELECT m.*, cm.conversation_id, cm.metadata, cm.attachment_url, cm.attachment_name, cm.attachment_type FROM messages m LEFT JOIN chat_message_meta cm ON cm.message_id = m.id WHERE m.phone = ?`;
  if (options.conversationId) { sql += ` AND cm.conversation_id = ?`; params.push(options.conversationId); }
  if (options.beforeId) { sql += ` AND m.id < ?`; params.push(options.beforeId); }
  sql += ` ORDER BY m.id DESC LIMIT ?`; params.push(limit);
  const rows = await store.all<any>(sql, params);
  return rows.reverse();
}

export async function deleteChatMessage(phone: string, messageId: number): Promise<boolean> {
  const store = await dbReady();
  const exists = await store.one(`SELECT id FROM messages WHERE id = ? AND phone = ?`, [messageId, phone]);
  if (!exists) return false;
  await store.transaction(async tx => {
    await tx.run(`DELETE FROM chat_message_meta WHERE message_id = ?`, [messageId]);
    await tx.run(`DELETE FROM messages WHERE id = ? AND phone = ?`, [messageId, phone]);
  });
  return true;
}

export async function clearChatConversation(phone: string, conversationId: string): Promise<number> {
  const store = await dbReady();
  return store.transaction(async tx => {
    const ids = await tx.all<{ message_id: number }>(`SELECT message_id FROM chat_message_meta WHERE conversation_id = ?`, [conversationId]);
    await tx.run(`DELETE FROM messages WHERE phone = ? AND id IN (SELECT message_id FROM chat_message_meta WHERE conversation_id = ?)`, [phone, conversationId]);
    await tx.run(`DELETE FROM chat_message_meta WHERE conversation_id = ?`, [conversationId]);
    await tx.run(`DELETE FROM chat_conversations WHERE id = ? AND phone = ?`, [conversationId, phone]);
    return ids.length;
  });
}
