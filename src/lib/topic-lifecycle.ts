import type { CanonicalTopic, CanonicalTopicRelationship, TopicTaxonomy, CanonicalTopicReply } from "@/lib/kurukoo-api";

const API_BASE = (import.meta.env.VITE_KURUKOO_API_BASE_URL ?? "").replace(/\/$/, "");
export const topicApiConfigured = () => Boolean(API_BASE);

function url(path: string) { return `${API_BASE}${path}`; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url(path), { credentials: "include", ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `Kurukoo request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export type OwnerTopic = CanonicalTopic & { authorPhone: string; moderationNote: string | null };
export type TopicSuggestion = { id: string; slug: string; title: string; body: string; type: string; category: string | null; city: string | null; lga: string | null; replyCount: number };
export type TopicChatContext = CanonicalTopic;
export type FollowedTopic = { topic: CanonicalTopic; relationship: CanonicalTopicRelationship };

export type TopicInput = { title: string; body: string; type: string; category?: string; skills?: string[]; city?: string; lga?: string; idempotencyKey?: string };

export async function fetchMyTopics(limit = 50) {
  const payload = await request<{ topics?: OwnerTopic[] }>(`/api/topics/mine/list?limit=${Math.min(100, Math.max(1, limit))}`);
  return Array.isArray(payload.topics) ? payload.topics : [];
}

export async function fetchMyTopic(id: string) {
  const payload = await request<{ topic?: OwnerTopic }>(`/api/topics/mine/${encodeURIComponent(id)}`);
  if (!payload.topic) throw new Error("Topic not found");
  return payload.topic;
}

export async function saveTopicDraft(input: TopicInput) {
  const payload = await request<{ topic?: OwnerTopic }>("/api/topics/drafts", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, idempotencyKey: input.idempotencyKey ?? randomKey() }),
  });
  if (!payload.topic) throw new Error("Topic draft could not be saved");
  return payload.topic;
}

export async function submitTopic(input: TopicInput) {
  const payload = await request<{ topic?: OwnerTopic }>("/api/topics", {
    method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey ?? randomKey() },
    body: JSON.stringify(input),
  });
  if (!payload.topic) throw new Error("Topic could not be submitted");
  return payload.topic;
}

export async function updateTopic(id: string, input: TopicInput) {
  const payload = await request<{ topic?: OwnerTopic }>(`/api/topics/${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (!payload.topic) throw new Error("Topic could not be updated");
  return payload.topic;
}

export async function removeTopic(id: string) {
  return request<{ id: string; removed: boolean }>(`/api/topics/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function fetchTopicSuggestions(title: string, category?: string) {
  const params = new URLSearchParams({ title });
  if (category) params.set("category", category);
  const payload = await request<{ candidates?: TopicSuggestion[] }>(`/api/topics/suggestions?${params.toString()}`);
  return Array.isArray(payload.candidates) ? payload.candidates : [];
}

export async function reportTopicReply(id: string, reason: string, detail?: string) {
  const payload = await request<{ report?: { id: string } }>(`/api/topics/replies/${encodeURIComponent(id)}/report`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, detail }),
  });
  return payload.report;
}

export async function fetchTopicChatContext(slug: string) {
  const payload = await request<{ topic?: TopicChatContext }>(`/api/topics/${encodeURIComponent(slug)}/chat-context`);
  if (!payload.topic) throw new Error("Topic context not found");
  return payload.topic;
}

export async function fetchFollowedTopics() {
  const payload = await request<{ relationships?: Array<CanonicalTopicRelationship & { targetId?: string; target_id?: string; targetType?: string; target_type?: string; status?: string }> }>("/api/relationships?relationshipType=follow");
  const relationships = Array.isArray(payload.relationships) ? payload.relationships : [];
  const topicRels = relationships.filter((item) => (item.targetType ?? item.target_type) === "topic" && (item.status ?? "active") !== "revoked");
  if (!topicRels.length) return [];
  const topics = await Promise.all(topicRels.map(async (relationship) => {
    const id = relationship.targetId ?? relationship.target_id;
    if (!id) return null;
    try { return { topic: await request<{ topic: CanonicalTopic }>(`/api/topics/id/${encodeURIComponent(id)}`).then((p) => p.topic), relationship }; }
    catch { return null; }
  }));
  return topics.filter((item): item is FollowedTopic => Boolean(item?.topic));
}

export function topicStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "draft": return "Draft";
    case "submitted": return "Awaiting moderation";
    case "public":
    case "published":
    case "active": return "Published";
    case "restricted": return "Restricted";
    case "removed": return "Removed";
    default: return status;
  }
}

export function typeGuidance(type: string) {
  const key = type.toLowerCase();
  const guidance: Record<string, string> = {
    question: "Ask one clear question and give enough context for useful replies.",
    opinion: "Share a considered viewpoint and make it clear that it is your opinion.",
    guide: "Explain a useful process, tips or things you have learned so others can follow it.",
    review: "Describe your experience with the subject. Keep claims grounded in what you actually experienced.",
    local_report: "Share a local observation with broad place context. Do not post a precise address.",
    price_report: "Describe the price you saw, when you saw it and the broad context. Treat it as reported, not independently verified.",
    recommendation: "Explain what you recommend and why; other people can add their own experiences.",
    meme: "Keep it light and avoid private information, harassment or misleading claims presented as fact.",
    poll: "Describe the question and options clearly. Voting is not yet available from the canonical Topic service.",
    event: "Include the date/time and broad location in the body. Avoid precise private addresses.",
    alert: "Use this for potentially important local information. Distinguish what you know from what you have not verified.",
    opportunity: "Describe the opportunity and useful context. Kurukoo can help people explore a verified next step separately.",
    experience: "Share what happened and what you learned, without exposing someone else's private information.",
  };
  return guidance[key] ?? "Share useful community context and keep claims grounded in what you know.";
}

function randomKey() {
  const cryptoApi = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID().replace(/-/g, "");
  return `topic-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export function sameRelationshipTopic(topic: CanonicalTopic, relationship: CanonicalTopicRelationship) {
  return relationship && topic.id === (relationship as CanonicalTopicRelationship & { targetId?: string }).targetId;
}

export type { CanonicalTopic, CanonicalTopicReply, CanonicalTopicRelationship, TopicTaxonomy };
