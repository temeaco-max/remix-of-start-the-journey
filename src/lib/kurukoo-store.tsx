// PROTOTYPE STATE with an optional canonical API bridge.
// When VITE_KURUKOO_API_BASE_URL is configured, chat goes to the real Kurukoo
// /api/chat/stream endpoint. Keep local fallback behaviour temporary and do not
// grow it into a second backend.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchChatHistory, fetchEconomicRequests, fetchNotifications, isKurukooApiConfigured, streamKurukooChat, type EconomicRequest } from "@/lib/kurukoo-api";

export type WorkStage = "understanding" | "working" | "needs_you" | "done";

export type WorkItem = {
  id: string;
  title: string;
  stage: WorkStage;
  detail: string;
  updated: string;
  steps: { label: string; done: boolean }[];
};

export type MessageCardData = Record<string, unknown>;
export type Message = {
  id: string;
  role: "you" | "kurukoo";
  text: string;
  workId?: string | undefined;
  cardData?: MessageCardData | null;
  canonicalAction?: string;
  progressStage?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  needsConfirmation: boolean;
  read: boolean;
};

export type Contact = {
  id: string;
  name: string;
  role: string;
  lastTouch: string;
};

export type MemoryNote = {
  id: string;
  label: string;
  value: string;
  source: string;
};

type State = {
  messages: Message[];
  work: WorkItem[];
  notifications: NotificationItem[];
  contacts: Contact[];
  memory: MemoryNote[];
  isSending: boolean;
  isLoadingHistory: boolean;
  lastError: string | null;
  send: (text: string) => void;
  loadConversation: (id: string) => Promise<void>;
  advance: (id: string) => void;
  confirm: (id: string) => void;
  markRead: (id: string) => void;
};

const KurukooContext = createContext<State | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

function reply(text: string): { answer: string; work?: WorkItem } {
  const t = text.toLowerCase();
  const asks = /find|book|repair|fix|need|get me|order|arrange|call|hire/.test(t);
  if (/what am i waiting for|status|show me what/.test(t))
    return { answer: "Here's where everything stands right now — open Work for the full trail." };
  if (asks) {
    const work: WorkItem = {
      id: uid(),
      title: text.replace(/^\s*(please\s+)?/i, "").replace(/\.$/, ""),
      stage: "understanding",
      detail: "Reading your request and lining up who can help.",
      updated: "just now",
      steps: [
        { label: "Understand the request", done: true },
        { label: "Reach suitable people", done: false },
        { label: "Bring back options", done: false },
        { label: "Confirm with you", done: false },
      ],
    };
    return {
      answer:
        "On it. I'll reach out and come back to you with options before anything is committed.",
      work,
    };
  }
  return { answer: "Got it. Tell me what you'd like done and I'll take it from there." };
}

function mapHistoryMessages(
  input: Array<{
    id: number;
    sender: string;
    content: string;
    card_data?: Record<string, unknown> | null;
    cardData?: Record<string, unknown> | null;
    metadata?: string | Record<string, unknown> | null;
  }>,
): Message[] {
  return input
    .filter((item) => item.sender === "user" || item.sender === "assistant")
    .map((item) => {
      let metadata: Record<string, unknown> | null = null;
      if (item.metadata && typeof item.metadata === "object") metadata = item.metadata;
      if (typeof item.metadata === "string") {
        try { const parsed = JSON.parse(item.metadata); if (parsed && typeof parsed === "object") metadata = parsed; } catch {}
      }
      return {
        id: String(item.id),
        role: item.sender === "user" ? "you" : "kurukoo",
        text: item.content,
        cardData: item.card_data ?? item.cardData ?? (metadata?.["cardData"] as Record<string, unknown> | undefined) ?? null,
      };
    });
}

function messageKey(messages: Message[]) {
  return messages.map((message) => `${message.id}:${message.role}:${message.text}`).join("|");
}

function mapEconomicRequestToWork(item: EconomicRequest): WorkItem {
  const req = item.requirements ?? {};
  const requestLabel = Object.values(req).filter((v) => typeof v === "string" && v.trim()).slice(0, 2).join(" · ");
  const labels: Record<string, string> = {
    requested: "Request received", awaiting_match: "Finding suitable options", partially_matched: "Checking available options",
    matched: "Options found", quoting: "Getting a quote", quoted: "Quote ready", awaiting_confirmation: "Needs your confirmation",
    reserved: "Reserved", payment_pending: "Payment needs review", paid: "Payment confirmed", in_fulfillment: "In fulfilment",
    fulfilled: "Ready to complete", completed: "Completed", cancelled: "Cancelled", disputed: "Under review",
    failed: "Needs attention", abandoned: "Expired",
  };
  const stage: WorkStage =
    ["completed", "cancelled", "abandoned"].includes(item.status) ? "done" :
    ["awaiting_confirmation", "payment_pending", "quoted"].includes(item.status) ? "needs_you" :
    ["requested", "awaiting_match", "partially_matched"].includes(item.status) ? "understanding" : "working";
  return {
    id: item.id,
    title: requestLabel ? item.skill.replace(/[_-]/g, " ") + " · " + requestLabel : item.skill.replace(/[_-]/g, " "),
    stage,
    detail: labels[item.status] ?? item.status.replace(/[_-]/g, " "),
    updated: item.updated_at ? new Date(item.updated_at).toLocaleString() : "recently",
    steps: [
      { label: "Understand the request", done: item.status !== "requested" },
      { label: "Find or coordinate suitable options", done: !["requested", "awaiting_match", "partially_matched"].includes(item.status) },
      { label: "Review quote or next step", done: !["quoting", "matched"].includes(item.status) },
      { label: "Confirm and complete", done: ["paid", "in_fulfillment", "fulfilled", "completed"].includes(item.status) },
    ],
  };
}

export function KurukooProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [contacts] = useState<Contact[]>([]);
  const [memory, setMemory] = useState<MemoryNote[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isKurukooApiConfigured()) return undefined;
    void Promise.all([fetchEconomicRequests(), fetchNotifications()])
      .then(([requests, notificationPayload]) => {
        if (cancelled) return;
        setWork(requests.map(mapEconomicRequestToWork));
        setNotifications((notificationPayload.notifications ?? []).map((item) => ({
          id: String(item.id),
          title: item.title ?? "Kurukoo update",
          body: item.body ?? "",
          when: item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recently",
          needsConfirmation: ["approval", "confirmation"].some((term) => String(item.type ?? "").includes(term)),
          read: Boolean(item.read || item.readAt),
        })));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isKurukooApiConfigured()) return undefined;
    setIsLoadingHistory(true);
    void fetchChatHistory(undefined, 50)
      .then(async (history) => {
        if (cancelled) return;
        const latestConversation = history.conversations?.[0]?.id ?? history.messages?.[history.messages.length - 1]?.conversationId ?? undefined;
        if (!latestConversation) {
          setMessages(mapHistoryMessages(history.messages ?? []));
          return;
        }
        const latest = await fetchChatHistory(latestConversation, 100);
        if (cancelled) return;
        setConversationId(latestConversation);
        setMessages(mapHistoryMessages(latest.messages ?? []));
      })
      .catch((error) => {
        if (!cancelled)
          setLastError(
            error instanceof Error ? error.message : "Unable to load conversation history.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    if (!isKurukooApiConfigured()) return;
    setIsLoadingHistory(true);
    setLastError(null);
    try {
      const history = await fetchChatHistory(id, 100);
      setConversationId(id);
      setMessages(mapHistoryMessages(history.messages ?? []));
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Unable to open that conversation.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || isSending) return;
      setLastError(null);

      if (!isKurukooApiConfigured()) {
        const { answer, work: newWork } = reply(clean);
        setMessages((m) => [
          ...m,
          { id: uid(), role: "you", text: clean },
          { id: uid(), role: "kurukoo", text: answer, workId: newWork?.id },
        ]);
        if (newWork) {
          setWork((w) => [newWork, ...w]);
          setMemory((m) => [
            {
              id: uid(),
              label: "Recent request",
              value: newWork.title,
              source: "From your conversation",
            },
            ...m,
          ]);
        }
        return;
      }

      const assistantId = uid();
      setMessages((m) => [
        ...m,
        { id: uid(), role: "you", text: clean },
        { id: assistantId, role: "kurukoo", text: "" },
      ]);
      setIsSending(true);

      try {
        const result = await streamKurukooChat({
          message: clean,
          conversationId,
          onEvent: (event) => {
            if (event.type === "conversation" && event.conversationId)
              setConversationId(event.conversationId);
            if (event.type === "progress") {
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId
                    ? { ...m, progressStage: event.progressStage ?? (event as unknown as { stage?: string }).stage }
                    : m,
                ),
              );
            }
            if (event.type === "text" && event.content) {
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId ? { ...m, text: `${m.text}${event.content}` } : m,
                ),
              );
            }
            if (event.type === "done") {
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        cardData: event.cardData ?? null,
                        canonicalAction: event.canonicalAction,
                        progressStage: event.progressStage,
                      }
                    : m,
                ),
              );
            }
            if (event.type === "error" && event.error) setLastError(event.error);
          },
        });
        if (result.conversationId) setConversationId(result.conversationId);
        if (result.reply)
          setMessages((current) =>
            current.map((m) => (m.id === assistantId ? { ...m, text: result.reply } : m)),
          );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Kurukoo could not complete that request.";
        setLastError(message);
        setMessages((current) =>
          current.map((m) =>
            m.id === assistantId
              ? { ...m, text: "I couldn't complete that just now. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending],
  );

  const advance = useCallback((id: string) => {
    setWork((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const nextIndex = item.steps.findIndex((s) => !s.done);
        if (nextIndex === -1) return item;
        const steps = item.steps.map((s, i) => (i === nextIndex ? { ...s, done: true } : s));
        const remaining = steps.filter((s) => !s.done).length;
        const stage: WorkStage =
          remaining === 0 ? "done" : remaining === 1 ? "needs_you" : "working";
        return {
          ...item,
          steps,
          stage,
          updated: "just now",
          detail:
            stage === "done"
              ? "Finished. Nothing left for you to do."
              : stage === "needs_you"
                ? "Ready for your confirmation."
                : "Working through it — I'll surface anything that needs you.",
        };
      }),
    );
  }, []);

  const confirm = useCallback(
    (id: string) =>
      setNotifications((n) =>
        n.map((item) =>
          item.id === id ? { ...item, needsConfirmation: false, read: true } : item,
        ),
      ),
    [],
  );
  const markRead = useCallback(
    (id: string) =>
      setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item))),
    [],
  );

  const value = useMemo(
    () => ({
      messages,
      work,
      notifications,
      contacts,
      memory,
      isSending,
      isLoadingHistory,
      lastError,
      send,
      loadConversation,
      advance,
      confirm,
      markRead,
    }),
    [
      messages,
      work,
      notifications,
      contacts,
      memory,
      isSending,
      isLoadingHistory,
      lastError,
      send,
      loadConversation,
      advance,
      confirm,
      markRead,
    ],
  );
  return <KurukooContext.Provider value={value}>{children}</KurukooContext.Provider>;
}

export function useKurukoo() {
  const ctx = useContext(KurukooContext);
  if (!ctx) throw new Error("useKurukoo must be used inside KurukooProvider");
  return ctx;
}
