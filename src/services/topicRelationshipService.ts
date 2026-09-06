import { getDb } from './database.js';
import type { Relationship } from './relationshipService.js';

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

function rowToRelationship(row: any): Relationship {
  return {
    id: String(row.rid),
    actorPhone: String(row.actor_phone),
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    relationshipType: String(row.relationship_type) as Relationship['relationshipType'],
    status: String(row.rstatus) as Relationship['status'],
    notificationPreference: String(row.notification_preference || 'all') as Relationship['notificationPreference'],
    visibility: String(row.visibility || 'private') as Relationship['visibility'],
    context: parseJsonObject(row.context_json),
    createdAt: String(row.rcreated_at),
    updatedAt: String(row.rupdated_at),
    revokedAt: row.revoked_at == null ? null : String(row.revoked_at),
  };
}

export type FollowedTopicRecord = {
  topic: {
    id: string; slug: string; title: string; body: string; type: string; category: string | null;
    skills: string[]; city: string | null; lga: string | null; status: string; createdAt: string;
    updatedAt: string; publishedAt: string | null; replyCount: number; authorLabel: string;
  };
  relationship: Relationship;
};

export async function listFollowedTopicsForActor(actorPhone: string, limit = 100): Promise<FollowedTopicRecord[]> {
  const db = await getDb();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));
  const statement = db.prepare(`
    SELECT r.id AS rid, r.actor_phone, r.target_type, r.target_id, r.relationship_type,
           r.status AS rstatus, r.notification_preference, r.visibility, r.context_json,
           r.created_at AS rcreated_at, r.updated_at AS rupdated_at, r.revoked_at,
           t.id AS tid, t.slug, t.title, t.body, t.type, t.category, t.skills_json,
           t.city, t.lga, t.status AS tstatus, t.created_at AS tcreated_at,
           t.updated_at AS tupdated_at, t.published_at,
           (SELECT COUNT(*) FROM topic_replies tr WHERE tr.topic_id=t.id AND tr.status='public') AS public_reply_count
    FROM relationships r
    JOIN topics t ON t.id=r.target_id AND r.target_type='topic' AND t.status='public'
    WHERE r.actor_phone=? AND r.relationship_type='follow' AND r.status='active'
    ORDER BY r.updated_at DESC
    LIMIT ?
  `);
  statement.bind([actorPhone, safeLimit]);
  const records: FollowedTopicRecord[] = [];
  while (statement.step()) {
    const row = statement.getAsObject();
    records.push({
      topic: {
        id: String(row.tid), slug: String(row.slug), title: String(row.title), body: String(row.body),
        type: String(row.type), category: row.category ? String(row.category) : null,
        skills: JSON.parse(String(row.skills_json || '[]')) as string[], city: row.city ? String(row.city) : null,
        lga: row.lga ? String(row.lga) : null, status: String(row.tstatus), createdAt: String(row.tcreated_at),
        updatedAt: String(row.tupdated_at), publishedAt: row.published_at ? String(row.published_at) : null,
        replyCount: Number(row.public_reply_count || 0), authorLabel: 'Community member',
      },
      relationship: rowToRelationship(row),
    });
  }
  statement.free();
  return records;
}
