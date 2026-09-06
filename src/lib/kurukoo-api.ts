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

export type CanonicalTopicResource = {
  slug: string;
  title: string;
};

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

const API_BASE = (import.meta.env.VITE_KURUKOO_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function isKurukooApiConfigured() {
  return Boolean(API_BASE);
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { credentials: "include", ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `Kurukoo request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchCanonicalTopics(limit = 5, filters?: { type?: string; category?: string }) {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(20, Math.max(1, limit))));
  if (filters?.type) params.set("type", filters.type);
  if (filters?.category) params.set("category", filters.category);
  const query = params.toString();
  const payload = await readJson<{ topics?: CanonicalTopic[] }>(`/api/topics${query ? `?${query}` : ""}`);
  return Array.isArray(payload.topics) ? payload.topics : [];
}

export async function fetchCanonicalTopic(slug: string) {
  const payload = await readJson<{ topic?: CanonicalTopic }>(`/api/topics/${encodeURIComponent(slug)}`);
  if (!payload.topic) throw new Error("Topic not found");
  return payload.topic;
}

export async function fetchTopicTaxonomy() {
  return readJson<TopicTaxonomy>("/api/topics/taxonomy");
}

export async function submitCanonicalReply(topicId: string, body: string) {
  const payload = await readJson<{ reply?: CanonicalTopicReply }>(`/api/topics/${encodeURIComponent(topicId)}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!payload.reply) throw new Error("Reply could not be submitted");
  return payload.reply;
}

export async function reportCanonicalTopic(topicId: string, reason: string) {
  const payload = await readJson<{ report?: { id: string } }>(`/api/topics/${encodeURIComponent(topicId)}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return payload.report;
}

export async function submitCanonicalTopic(input: {
  title: string;
  body: string;
  type: string;
  category?: string;
  skills?: string[];
  city?: string;
  lga?: string;
}) {
  const payload = await readJson<{ topic?: CanonicalTopic }>("/api/topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID().replace(/-/g, ""),
    },
    body: JSON.stringify(input),
  });
  if (!payload.topic) throw new Error("Topic could not be submitted");
  return payload.topic;
}

export async function fetchProactiveFeed() {
  const payload = await readJson<{ opportunities?: ProactiveOpportunity[] }>("/api/v1/proactive/feed");
  return Array.isArray(payload.opportunities) ? payload.opportunities : [];
}

export async function streamKurukooChat(input: {
  message: string;
  conversationId?: string | undefined;
  onEvent: (event: ChatStreamEvent) => void;
}): Promise<{ conversationId?: string | undefined; reply: string }> {
  const response = await fetch(apiUrl("/api/v1/chat/stream"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message.trim(),
      conversationId: input.conversationId,
      channel: "web",
    }),
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload?.error === "string" ? payload.error : `Chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let conversationId = input.conversationId;

  const consume = (chunk: string) => {
    buffer += chunk;
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!data || data === "[DONE]") continue;
      try {
        const event = JSON.parse(data) as ChatStreamEvent;
        input.onEvent(event);
        if (typeof event.conversationId === "string") conversationId = event.conversationId;
        if (event.type === "text" && typeof event.content === "string") reply += event.content;
        if (event.type === "delta" && typeof event.text === "string") reply += event.text;
        if (event.type === "done" && typeof event.fullReply === "string") reply = event.fullReply;
      } catch {
        input.onEvent({ type: "error", error: "Kurukoo returned an unreadable response." });
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    consume(decoder.decode(value, { stream: true }));
  }
  consume(decoder.decode());

  return { conversationId, reply: reply.trim() };
}
