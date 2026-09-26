// Canonical-first shared state. The local path is only a disconnected development fallback.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchChatHistory,
  fetchEconomicRequests,
  fetchNotifications,
  isKurukooApiConfigured,
  markNotificationRead,
  streamKurukooChat,
  type EconomicRequest,
  type ToolActivityEntry,
} from "@/lib/kurukoo-api";

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
  workId?: string;
  cardData?: MessageCardData | null;
  canonicalAction?: string;
  progressStage?: string;
  capabilityResult?: MessageCardData | null;
  /** Real observed agent tool steps, so the user can see the work happen. */
  toolActivity?: ToolActivityEntry[];
  createdAt?: string | null;
};
export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  needsConfirmation: boolean;
  read: boolean;
  link?: string | null;
  objectType?: string | null;
  objectId?: string | number | null;
  conversationId?: string | null;
  canonicalAction?: string | null;
  deliveryState?: string | null;
};
export type Contact = { id: string; name: string; role: string; lastTouch: string };
export type MemoryNote = { id: string; label: string; value: string; source: string };
type State = {
  messages: Message[];
  work: WorkItem[];
  notifications: NotificationItem[];
  contacts: Contact[];
  memory: MemoryNote[];
  isSending: boolean;
  isLoadingHistory: boolean;
  lastError: string | null;
  conversationId: string | undefined;
  send: (text: string, attachment?: unknown) => void;
  regenerateLast: () => void;
  notifyAssistant: (text: string, cardData?: MessageCardData | null) => void;
  loadConversation: (id: string) => Promise<void>;
  advance: (id: string) => void;
  confirm: (id: string) => void;
  markRead: (id: string) => void;
};
const KurukooContext = createContext<State | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

function cleanTitle(text: string) {
  return text
    .replace(/^\s*(please\s+)?/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
}

function reply(text: string): { answer: string; work?: WorkItem; cardData?: MessageCardData } {
  const t = text.toLowerCase();
  const asks = /find|book|repair|fix|need|get me|order|arrange|call|hire|help me/.test(t);
  if (/what am i waiting for|status|show me what|what are you doing/.test(t))
    return {
      answer: "Here's where everything stands right now.",
      cardData: {
        type: "request_status",
        title: "Current work",
        status: "ready",
        body: "Open Work to follow each request from discovery through completion.",
      },
    };
  if (/explain|how does this work|how do you work/.test(t))
    return {
      answer:
        "Kurukoo turns a plain-language request into a visible piece of work. It understands what you mean, finds or coordinates suitable options when connected evidence is available, asks before consequential actions, then keeps the outcome here.",
      cardData: {
        type: "action",
        title: "The Kurukoo flow",
        body: "Tell → Understand → Find → Choose → Approve → Do → Show proof → Done",
        options: ["Tell Kurukoo what I need", "Open Work"],
      },
    };
  if (asks) {
    const ride = /ride|taxi|transport|driver/.test(t);
    const id = uid();
    const title = cleanTitle(text);
    const work: WorkItem = {
      id,
      title,
      stage: "understanding",
      detail:
        "Request received. Kurukoo is ready to clarify the outcome and find a supported route.",
      updated: "just now",
      steps: [
        { label: "Understand the request", done: true },
        { label: "Find or coordinate suitable options", done: false },
        { label: "Review the next step with you", done: false },
        { label: "Complete and show the outcome", done: false },
      ],
    };
    const cardData: MessageCardData = ride
      ? {
          type: "request",
          requestId: id,
          title: "Ride request",
          status: "understanding",
          skill: "ride",
          body: "The preview has captured the request. Live provider matching requires a connected source of current provider evidence.",
          pickup: "Not provided",
          destination: "Not provided",
          evidence: "No live provider evidence in preview",
          options: ["Tell Kurukoo my pickup and destination", "Open this request"],
        }
      : {
          type: "request",
          requestId: id,
          title,
          status: "understanding",
          skill: "service",
          body: "The preview has captured the request. Kurukoo will only present providers or offers when connected evidence supports them.",
          evidence: "No live provider evidence in preview",
          options: ["Add more details", "Open this request"],
        };
    return {
      answer:
        "I’ve got the job. Before I claim I can fulfil it, I’ll make the missing context and available evidence clear.",
      work,
      cardData,
    };
  }
  return {
    answer:
      "Tell me the outcome you want, in your own words. You don't need to know the right category first.",
    cardData: {
      type: "action",
      title: "Start with the outcome",
      body: "Kurukoo can help with services, products, places, mobility, repairs, coordination and other supported real-world requests.",
      options: [
        "Find me a trusted provider",
        "Get me a ride",
        "Order something",
        "Help me fix something",
      ],
    },
  };
}

function mapHistoryMessages(
  input: Array<{
    id: number;
    sender: string;
    content: string;
    card_data?: Record<string, unknown> | null;
    cardData?: Record<string, unknown> | null;
    metadata?: string | Record<string, unknown> | null;
    created_at?: string | null;
    createdAt?: string | null;
  }>,
): Message[] {
  return input
    .filter((item) => item.sender === "user" || item.sender === "assistant")
    .map((item) => {
      let metadata: Record<string, unknown> | null = null;
      if (item.metadata && typeof item.metadata === "object") metadata = item.metadata;
      if (typeof item.metadata === "string") {
        try {
          const parsed = JSON.parse(item.metadata);
          if (parsed && typeof parsed === "object") metadata = parsed;
        } catch {}
      }
      return {
        id: String(item.id),
        role: item.sender === "user" ? "you" : "kurukoo",
        text: item.content,
        createdAt: item.createdAt ?? item.created_at ?? null,
        cardData:
          item.card_data ??
          item.cardData ??
          (metadata?.["cardData"] as Record<string, unknown> | undefined) ??
          null,
      };
    });
}
function mapEconomicRequestToWork(item: EconomicRequest): WorkItem {
  const req = item.requirements ?? {};
  const requestLabel = Object.values(req)
    .filter((v) => typeof v === "string" && v.trim())
    .slice(0, 2)
    .join(" · ");
  const labels: Record<string, string> = {
    requested: "Request received",
    awaiting_match: "Finding suitable options",
    partially_matched: "Checking available options",
    matched: "Options found",
    quoting: "Getting a quote",
    quoted: "Quote ready",
    awaiting_confirmation: "Needs your confirmation",
    reserved: "Reserved",
    payment_pending: "Payment needs review",
    paid: "Payment confirmed",
    in_fulfillment: "In fulfilment",
    fulfilled: "Ready to complete",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Under review",
    failed: "Needs attention",
    abandoned: "Expired",
  };
  const stage: WorkStage = ["completed", "cancelled", "abandoned"].includes(item.status)
    ? "done"
    : ["awaiting_confirmation", "payment_pending", "quoted"].includes(item.status)
      ? "needs_you"
      : ["requested", "awaiting_match", "partially_matched"].includes(item.status)
        ? "understanding"
        : "working";
  return {
    id: item.id,
    title: requestLabel
      ? item.skill.replace(/[_-]/g, " ") + " · " + requestLabel
      : item.skill.replace(/[_-]/g, " "),
    stage,
    detail: labels[item.status] ?? item.status.replace(/[_-]/g, " "),
    updated: item.updated_at ? new Date(item.updated_at).toLocaleString() : "recently",
    steps: [
      { label: "Understand the request", done: item.status !== "requested" },
      {
        label: "Find or coordinate suitable options",
        done: !["requested", "awaiting_match", "partially_matched"].includes(item.status),
      },
      { label: "Review quote or next step", done: !["quoting", "matched"].includes(item.status) },
      {
        label: "Confirm and complete",
        done: ["paid", "in_fulfillment", "fulfilled", "completed"].includes(item.status),
      },
    ],
  };
}
function mapNotifications(
  input: Array<{
    id: string | number;
    title?: string | null;
    body?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
    type?: string | null;
    read?: boolean;
    readAt?: string | null;
    status?: string | null;
    read_at?: string | null;
    link?: string | null;
    objectType?: string | null;
    object_type?: string | null;
    objectId?: string | number | null;
    object_id?: string | number | null;
    conversationId?: string | null;
    conversation_id?: string | null;
    canonicalAction?: string | null;
    canonical_action?: string | null;
    deliveryState?: string | null;
    delivery_state?: string | null;
  }>,
): NotificationItem[] {
  return input.map((item) => {
    const createdAt = item.createdAt ?? item.created_at ?? null;
    const read = Boolean(item.read || item.readAt || item.read_at || item.status === "read");
    return {
      id: String(item.id),
      title: item.title ?? "Kurukoo update",
      body: item.body ?? "",
      when: createdAt ? new Date(createdAt).toLocaleString() : "Recently",
      needsConfirmation:
        ["approval", "confirmation"].some((term) => String(item.type ?? "").includes(term)) ||
        /approve|confirm|quote/i.test(String(item.title ?? "") + " " + String(item.body ?? "")),
      read,
      link: item.link ?? null,
      objectType: item.objectType ?? item.object_type ?? null,
      objectId: item.objectId ?? item.object_id ?? null,
      conversationId: item.conversationId ?? item.conversation_id ?? null,
      canonicalAction: item.canonicalAction ?? item.canonical_action ?? null,
      deliveryState: item.deliveryState ?? item.delivery_state ?? null,
    };
  });
}

export function KurukooProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [contacts] = useState<Contact[]>([]);
  const [memory, setMemory] = useState<MemoryNote[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const ephemeralRef = useRef(new Map<string, Message[]>());
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  const refreshCanonicalState = useCallback(async () => {
    if (!isKurukooApiConfigured()) return;
    try {
      const [requests, notificationPayload] = await Promise.all([
        fetchEconomicRequests(),
        fetchNotifications(),
      ]);
      setWork(requests.map(mapEconomicRequestToWork));
      setNotifications(mapNotifications(notificationPayload.notifications ?? []));
    } catch {}
  }, []);
  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    void refreshCanonicalState();
  }, [refreshCanonicalState]);
  useEffect(() => {
    let cancelled = false;
    if (!isKurukooApiConfigured()) return undefined;
    setIsLoadingHistory(true);
    void fetchChatHistory(undefined, 50)
      .then(async (history) => {
        if (cancelled) return;
        const latestConversation =
          history.conversations?.[0]?.id ??
          history.messages?.[history.messages.length - 1]?.conversationId ??
          undefined;
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
      const server = mapHistoryMessages(history.messages ?? []);
      const stashed = ephemeralRef.current.get(id) ?? [];
      setMessages(stashed.length ? [...server, ...stashed] : server);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Unable to open that conversation.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);
  const send = useCallback(
    async (text: string, attachment?: unknown) => {
      const clean = text.trim();
      if (!clean || isSending) return;
      setLastError(null);
      if (!isKurukooApiConfigured()) {
        const local = reply(clean);
        const stamped = new Date().toISOString();
        setMessages((m) => [
          ...m,
          { id: uid(), role: "you", text: clean, createdAt: stamped },
          {
            id: uid(),
            role: "kurukoo",
            text: local.answer,
            createdAt: stamped,
            workId: local.work?.id,
            cardData: local.cardData,
          },
        ]);
        if (local.work) {
          setWork((w) => [local.work!, ...w]);
          setMemory((m) => [
            {
              id: uid(),
              label: "Recent request",
              value: local.work!.title,
              source: "Disconnected development fallback",
            },
            ...m,
          ]);
        }
        return;
      }
      const assistantId = uid();
      const stamped = new Date().toISOString();
      const attachedNames = Array.isArray(attachment)
        ? attachment
            .map((a) =>
              a && typeof a === "object" ? String((a as Record<string, unknown>).name || "") : "",
            )
            .filter(Boolean)
        : [];
      const displayText = attachedNames.length
        ? `${clean}\n[Attached: ${attachedNames.join(", ")}]`
        : clean;
      setMessages((m) => [
        ...m,
        { id: uid(), role: "you", text: displayText, createdAt: stamped },
        { id: assistantId, role: "kurukoo", text: "", createdAt: stamped },
      ]);
      setIsSending(true);
      const streamController = new AbortController();
      const streamTimeout = window.setTimeout(() => streamController.abort(), 120_000);
      try {
        const result = await streamKurukooChat({
          message: displayText,
          conversationId,
          attachment,
          signal: streamController.signal,
          onEvent: (event) => {
            if (event.type === "conversation" && event.conversationId)
              setConversationId(event.conversationId);
            if (event.type === "progress")
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        progressStage:
                          event.progressStage ?? (event as unknown as { stage?: string }).stage,
                      }
                    : m,
                ),
              );
            if (event.type === "text" && event.content)
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId ? { ...m, text: `${m.text}${event.content}` } : m,
                ),
              );
            if (event.type === "done")
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        cardData: event.cardData ?? null,
                        canonicalAction: event.canonicalAction,
                        progressStage: event.progressStage,
                        capabilityResult: event.capabilityResult ?? m.capabilityResult ?? null,
                      }
                    : m,
                ),
              );
            if (event.type === "capability_result") {
              const carried = (event.capabilityResult ??
                (event as unknown as { result?: MessageCardData | null }).result ??
                null) as MessageCardData | null;
              if (carried)
                setMessages((current) =>
                  current.map((m) =>
                    m.id === assistantId ? { ...m, capabilityResult: carried } : m,
                  ),
                );
            }
            if (event.type === "error" && event.error) setLastError(event.error);
            if (event.type === "tool_activity" && event.toolActivity) {
              const step = event.toolActivity;
              setMessages((current) =>
                current.map((m) => {
                  if (m.id !== assistantId) return m;
                  const existing = m.toolActivity ?? [];
                  const at = existing.findIndex((entry) => entry.step === step.step);
                  const next = at >= 0
                    ? existing.map((entry, i) => (i === at ? step : entry))
                    : [...existing, step];
                  return { ...m, toolActivity: next };
                }),
              );
            }
          },
        });
        if (result.conversationId) setConversationId(result.conversationId);
        if (result.reply)
          setMessages((current) =>
            current.map((m) => (m.id === assistantId ? { ...m, text: result.reply } : m)),
          );
        await refreshCanonicalState();
      } catch (error) {
        setLastError(
          error instanceof DOMException && error.name === "AbortError"
            ? "Kurukoo took too long to reply. Please try again."
            : error instanceof Error
              ? error.message
              : "Kurukoo could not complete that request.",
        );
        setMessages((current) =>
          current.map((m) =>
            m.id === assistantId
              ? { ...m, text: "I couldn't complete that just now. Please try again." }
              : m,
          ),
        );
      } finally {
        window.clearTimeout(streamTimeout);
        setIsSending(false);
      }
    },
    [conversationId, isSending, refreshCanonicalState],
  );
  /** Revise-in-place: drops the last user turn and everything after it, then
   * resends the same text so history holds one attempt instead of duplicates. */
  const regenerateLast = useCallback(() => {
    if (isSending) return;
    const reversed = [...messages].reverse();
    const offset = reversed.findIndex((m) => m.role === "you" && m.text.trim());
    if (offset === -1) return;
    const lastUser = messages[messages.length - 1 - offset];
    setMessages((m) => m.slice(0, m.length - 1 - offset));
    void send(lastUser.text);
  }, [isSending, messages, send]);
  /** Truthful outcome injector: appends an assistant message stating exactly
   * what a completed coordinator call returned. Never invents state. */
  const notifyAssistant = useCallback((text: string, cardData?: MessageCardData | null) => {
    const clean = text.trim();
    if (!clean) return;
    const message: Message = {
      id: uid(),
      role: "kurukoo",
      text: clean,
      createdAt: new Date().toISOString(),
      cardData: cardData ?? null,
    };
    const key = conversationIdRef.current ?? "unscoped";
    ephemeralRef.current.set(key, [...(ephemeralRef.current.get(key) ?? []), message].slice(-5));
    setMessages((m) => [...m, message]);
  }, []);
  const advance = useCallback(
    (id: string) => {
      if (isKurukooApiConfigured()) {
        void refreshCanonicalState();
        return;
      }
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
                ? "Finished."
                : stage === "needs_you"
                  ? "Ready for your confirmation."
                  : "Working through the next step.",
          };
        }),
      );
    },
    [refreshCanonicalState],
  );
  const confirm = useCallback(
    (id: string) => {
      if (isKurukooApiConfigured()) {
        void refreshCanonicalState();
        return;
      }
      setNotifications((n) =>
        n.map((item) =>
          item.id === id ? { ...item, needsConfirmation: false, read: true } : item,
        ),
      );
    },
    [refreshCanonicalState],
  );
  const markRead = useCallback((id: string) => {
    if (!isKurukooApiConfigured()) {
      setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item)));
      return;
    }
    void markNotificationRead(id)
      .then(() =>
        setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item))),
      )
      .catch((error) =>
        setLastError(
          error instanceof Error ? error.message : "Unable to update that notification.",
        ),
      );
  }, []);
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
      conversationId,
      send,
      regenerateLast,
      notifyAssistant,
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
      conversationId,
      send,
      regenerateLast,
      notifyAssistant,
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
