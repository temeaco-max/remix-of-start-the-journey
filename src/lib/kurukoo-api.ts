export type ChatStreamEvent = {
  type: string;
  conversationId?: string;
  content?: string;
  text?: string;
  fullReply?: string;
  error?: string;
};

export type CanonicalTopicReply = {
  id: string;
  topicId: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authorLabel: string;
};

export type CanonicalTopicResource = { slug: string; title: string };
export type CanonicalTopicRelationship = { relationshipType: string; notificationPreference?: string };

export type CanonicalTopic = {
  id: string;
  slug: string;
  title: string;
  body: string;
  type: string;
  category: string | null;
  skills: string[];
  city: string | null;
  lga: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  replyCount: number;
  authorLabel: string;
  replies?: CanonicalTopicReply[];
  relatedResources?: CanonicalTopicResource[];
  provenance?: string;
};

export type TopicTaxonomy = {
  types: string[];
  categories: string[];
  skillsByCategory: Record<string, string[]>;
};

export type ChatHistoryMessage = {
  id: number;
  sender: "user" | "assistant" | "system" | string;
  content: string;
  conversation_id?: string | null;
  conversationId?: string | null;
  created_at?: string;
  createdAt?: string;
};

export type ChatHistoryResponse = {
  success?: boolean;
  conversations?: Array<{ id: string; title?: string | null; channel?: string; updated_at?: string }>;
  messages?: ChatHistoryMessage[];
  nextBeforeId?: number | null;
};

export type ProactiveOpportunity = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  status: string;
  createdAt: string;
};

const API_BASE = (import.meta.env['VITE_KURUKOO_API_BASE_URL'] ?? "").replace(/\/$/, "");

function apiUrl(path: string) { return `${API_BASE}${path}`; }
export function isKurukooApiConfigured() { return Boolean(API_BASE); }

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { credentials: "include", ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `Kurukoo request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}



export type DiscoveryEntity = {
  id: string;
  name: string;
  kind: string;
  category?: string | null;
  description?: string | null;
  lat?: number;
  lng?: number;
  location?: string | null;
  source?: string | null;
  freshness?: string | null;
  evidence?: string | null;
  lifecycle?: string | null;
  available?: boolean | null;
  liveNow?: boolean | null;
  skills?: string[];
  chatAction?: { type?: string; entityId?: string; conversationId?: string | null } | null;
};

export type PulseProvider = {
  id: string;
  skill: string;
  name: string;
  location?: string;
  subscription_tier?: string;
  source: "mobile" | "stationary";
  lat: number;
  lng: number;
  location_radius_m: number;
  verified: true;
  live_now: true;
};

export type PulseReadiness = {
  radarDefaultOn: boolean;
  active: boolean;
  eligibleToBroadcast: boolean;
  role: "provider" | "user";
  nudge?: string;
};

export async function fetchDiscoveryEntities(input?: { lat?: number; lng?: number; radius?: number; layers?: string[]; q?: string }) {
  const params = new URLSearchParams();
  if (input?.lat !== undefined) params.set("lat", String(input.lat));
  if (input?.lng !== undefined) params.set("lng", String(input.lng));
  params.set("radius", String(input?.radius ?? 5000));
  params.set("layers", (input?.layers ?? ["mobile", "stationary", "agents", "emergency", "deals", "events"]).join(","));
  if (input?.q) params.set("q", input.q);
  const payload = await readJson<{ entities?: DiscoveryEntity[] }>(`/api/discover/entities?${params.toString()}`);
  return Array.isArray(payload.entities) ? payload.entities : [];
}

export async function fetchDiscoveryMap(input?: { lat?: number; lng?: number; radius?: number; layers?: string[] }) {
  const params = new URLSearchParams();
  if (input?.lat !== undefined) params.set("lat", String(input.lat));
  if (input?.lng !== undefined) params.set("lng", String(input.lng));
  params.set("radius", String(input?.radius ?? 5000));
  params.set("layers", (input?.layers ?? ["mobile", "stationary", "agents", "emergency", "deals", "events"]).join(","));
  return readJson<{ type: "FeatureCollection"; features?: Array<{ id?: string; type?: string; geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown> }>; meta?: Record<string, unknown> }>(`/api/discover/map?${params.toString()}`);
}

export async function fetchPublicPulseProviders() {
  const payload = await readJson<{ providers?: PulseProvider[] }>("/api/pulse/providers");
  return Array.isArray(payload.providers) ? payload.providers : [];
}

export async function fetchPulseReadiness() {
  return readJson<PulseReadiness>("/api/pulse/readiness");
}

export async function activatePulse(skill: string, lat: number, lng: number) {
  return readJson<{ success: boolean; message: string }>("/api/pulse/live", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, lat, lng }),
  });
}

export async function deactivatePulse() {
  return readJson<{ success: boolean; message: string }>("/api/pulse/deactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
}

export async function fetchCanonicalTopics(limit = 5, filters?: { type?: string; category?: string }) {
  const params = new URLSearchParams({ limit: String(Math.min(20, Math.max(1, limit))) });
  if (filters?.type) params.set("type", filters.type);
  if (filters?.category) params.set("category", filters.category);
  const payload = await readJson<{ topics?: CanonicalTopic[] }>(`/api/topics?${params.toString()}`);
  return Array.isArray(payload.topics) ? payload.topics : [];
}

export async function fetchCanonicalTopic(slug: string) {
  const payload = await readJson<{ topic?: CanonicalTopic }>(`/api/topics/${encodeURIComponent(slug)}`);
  if (!payload.topic) throw new Error("Topic not found");
  return payload.topic;
}

export async function fetchTopicTaxonomy() { return readJson<TopicTaxonomy>("/api/topics/taxonomy"); }

export async function fetchTopicRelationship(topicId: string) {
  const payload = await readJson<{ relationship?: CanonicalTopicRelationship | null }>(`/api/relationships/topic/${encodeURIComponent(topicId)}`);
  return payload.relationship ?? null;
}

export async function followCanonicalTopic(topicId: string) {
  const payload = await readJson<{ relationship?: CanonicalTopicRelationship }>("/api/relationships", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "topic", targetId: topicId, relationshipType: "follow" }),
  });
  return payload.relationship ?? null;
}

export async function unfollowCanonicalTopic(topicId: string) { await readJson(`/api/relationships/topic/${encodeURIComponent(topicId)}`, { method: "DELETE" }); }

export async function setTopicNotificationPreference(topicId: string, preference: "all" | "muted") {
  const payload = await readJson<{ relationship?: CanonicalTopicRelationship }>(`/api/relationships/topic/${encodeURIComponent(topicId)}/preferences`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ relationshipType: "follow", notificationPreference: preference }),
  });
  return payload.relationship ?? null;
}

export async function submitCanonicalReply(topicId: string, body: string) {
  const payload = await readJson<{ reply?: CanonicalTopicReply }>(`/api/topics/${encodeURIComponent(topicId)}/replies`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
  });
  if (!payload.reply) throw new Error("Reply could not be submitted");
  return payload.reply;
}

export async function reportCanonicalTopic(topicId: string, reason: string) {
  const payload = await readJson<{ report?: { id: string } }>(`/api/topics/${encodeURIComponent(topicId)}/report`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
  });
  return payload.report;
}

export async function submitCanonicalTopic(input: { title: string; body: string; type: string; category?: string; skills?: string[]; city?: string; lga?: string }) {
  const payload = await readJson<{ topic?: CanonicalTopic }>("/api/topics", {
    method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID().replace(/-/g, "") }, body: JSON.stringify(input),
  });
  if (!payload.topic) throw new Error("Topic could not be submitted");
  return payload.topic;
}

export async function fetchChatHistory(conversationId?: string, limit = 50) {
  const params = new URLSearchParams({ limit: String(Math.min(100, Math.max(1, limit))) });
  if (conversationId) params.set("conversationId", conversationId);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    return await readJson<ChatHistoryResponse>(`/api/v1/chat/history?${params.toString()}`, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchProactiveFeed() {
  const payload = await readJson<{ opportunities?: ProactiveOpportunity[] }>("/api/v1/proactive/feed");
  return Array.isArray(payload.opportunities) ? payload.opportunities : [];
}

export async function streamKurukooChat(input: { message: string; conversationId?: string | undefined; onEvent: (event: ChatStreamEvent) => void }): Promise<{ conversationId?: string | undefined; reply: string }> {
  const response = await fetch(apiUrl("/api/v1/chat/stream"), {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message.trim(), conversationId: input.conversationId, channel: "web" }),
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload?.error === "string" ? payload.error : `Chat request failed (${response.status})`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ""; let reply = ""; let conversationId = input.conversationId;
  const consume = (chunk: string) => {
    buffer += chunk;
    const frames = buffer.split("\n\n"); buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
      if (!data) continue;
      try {
        const parsed = JSON.parse(data) as ChatStreamEvent | "[DONE]";
        if (parsed === "[DONE]") continue;
        input.onEvent(parsed);
        if (typeof parsed.conversationId === "string") conversationId = parsed.conversationId;
        if (parsed.type === "text" && typeof parsed.content === "string") reply += parsed.content;
        if (parsed.type === "delta" && typeof parsed.text === "string") reply += parsed.text;
        if (parsed.type === "done" && typeof parsed.fullReply === "string") reply = parsed.fullReply;
      } catch { input.onEvent({ type: "error", error: "Kurukoo returned an unreadable response." }); }
    }
  };
  while (true) { const { value, done } = await reader.read(); if (done) break; consume(decoder.decode(value, { stream: true })); }
  consume(decoder.decode());
  return { conversationId, reply: reply.trim() };
}

export type CanonicalMemoryFact = {
  id: number;
  field: string;
  value: string;
  provenance?: string;
  confidence?: number;
  sourceConversationId?: string | null;
  observedAt?: string | null;
  expiresAt?: string | null;
};

export async function fetchCanonicalMemoryFacts() {
  const payload = await readJson<{ facts?: CanonicalMemoryFact[] }>("/api/memory/facts");
  return Array.isArray(payload.facts) ? payload.facts : [];
}

export async function revokeCanonicalMemoryFact(id: number) {
  return readJson<{ success: boolean; revoked?: boolean }>(`/api/memory/facts/${encodeURIComponent(String(id))}`, { method: "DELETE" });
}