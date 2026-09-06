export type ChatStreamEvent = {
  type: string;
  conversationId?: string;
  content?: string;
  text?: string;
  fullReply?: string;
  error?: string;
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
  if (!response.ok) throw new Error(`Kurukoo request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function fetchCanonicalTopics(limit = 5) {
  const payload = await readJson<{ topics?: CanonicalTopic[] }>(`/api/v1/topics?limit=${Math.min(20, Math.max(1, limit))}`);
  return Array.isArray(payload.topics) ? payload.topics : [];
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
