import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AudioLines,
  MessageCircle,
  Settings,
  Sparkles,
  X,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { ChatDiscovery } from "@/components/kurukoo/chat-discovery";
import {
  activateQrContext,
  addCartItem,
  advanceStorefrontAction,
  fetchChatHistory,
  selectFulfilmentOffer,
  sendComposedEmail,
  submitFormPacket,
  submitServiceReview,
} from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat / Voice — Kurukoo" },
      { name: "description", content: "Talk to Kurukoo and tell it what needs doing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

const suggestions = [
  "Get me a ride to the airport tomorrow morning.",
  "Find me a trusted plumber for a leaking sink.",
  "Help me plan and track a task I keep putting off.",
  "Remind me to call my mother on Sunday evening.",
];
const agentIntro = ["Hi, I'm Kurukoo. What would you like to get done?"];
type TopicContext = {
  id: string;
  slug: string;
  title: string;
  type: string;
  category: string | null;
  city: string | null;
  lga: string | null;
};

function AgentMark({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`relative grid size-10 shrink-0 place-items-center rounded-[13px] border ${active ? "border-[var(--color-success)] bg-primary/10" : "border-border bg-elevated"}`}
      aria-label="Kurukoo agent"
    >
      <span className="grid size-7 place-items-center rounded-full bg-primary/12 ring-1 ring-primary/20">
        <Sparkles className="size-[17px] text-primary" strokeWidth={1.8} />
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-[var(--color-success)]" />
    </span>
  );
}
function AgentIntro() {
  return (
    <div className="space-y-3">
      {agentIntro.map((text) => (
        <div
          key={text}
          className="flex items-start gap-3 motion-safe:animate-[fade-in_240ms_ease-out]"
        >
          <AgentMark />
          <div className="max-w-[760px] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[13.5px] leading-6 shadow-sm">
            {text}
          </div>
        </div>
      ))}
    </div>
  );
}
function ActiveWork({ work }: { work: ReturnType<typeof useKurukoo>["work"] }) {
  const active = work.filter((item) => item.stage !== "done");
  if (!active.length) return null;
  return (
    <section
      aria-label="Kurukoo is taking care of"
      className="mx-auto mt-4 w-full max-w-[820px] border-y border-border py-3"
    >
      <div className="flex items-center gap-2 text-[11px] font-medium">
        <Clock3 className="size-3.5 text-primary" /> Kurukoo is taking care of
      </div>
      <div className="mt-2 divide-y divide-border/70">
        {active.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            to="/work/$workId"
            params={{ workId: item.id }}
            className="group flex items-center gap-3 py-2.5 hover:bg-elevated/50"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.title}</span>
            <span className="shrink-0 text-[10.5px] text-muted-foreground">{item.updated}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ChatSettings({ onClose }: { onClose: () => void }) {
  const [voiceStyle, setVoiceStyle] = useState("calm");
  const [language, setLanguage] = useState("en-GB");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("kurukoo-voice-preferences") || "{}");
      if (prefs.style) setVoiceStyle(prefs.style);
      if (prefs.language) setLanguage(prefs.language);
      if (typeof prefs.ttsEnabled === "boolean") setTtsEnabled(prefs.ttsEnabled);
    } catch {}
  }, []);
  function savePreferences(next: { style: string; language: string; ttsEnabled: boolean }) {
    localStorage.setItem("kurukoo-voice-preferences", JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("kurukoo-voice-preferences", {
        detail: next,
      }),
    );
    setVoiceStyle(next.style);
    setLanguage(next.language);
    setTtsEnabled(next.ttsEnabled);
  }
  function saveVoice(nextStyle: string, nextLanguage: string) {
    savePreferences({ style: nextStyle, language: nextLanguage, ttsEnabled });
  }
  function saveTts(next: boolean) {
    savePreferences({ style: voiceStyle, language, ttsEnabled: next });
  }
  return (
    <div className="absolute right-2 top-[58px] z-40 w-[min(390px,calc(100vw-16px))] rounded-2xl border border-border bg-surface p-4 text-left shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold">Chat & voice settings</p>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            Control how Kurukoo talks and which agent handles your work.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="grid size-11 place-items-center rounded-full hover:bg-elevated"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Voice
          <select
            value={voiceStyle}
            onChange={(e) => saveVoice(e.target.value, language)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] font-medium outline-none"
          >
            <option value="calm">Calm</option>
            <option value="clear">Clear</option>
            <option value="warm">Warm</option>
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Language
          <select
            value={language}
            onChange={(e) => saveVoice(voiceStyle, e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] font-medium outline-none"
          >
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
            <option value="fr-FR">Français</option>
            <option value="es-ES">Español</option>
            <option value="pt-BR">Português</option>
            <option value="sw-KE">Kiswahili</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={() => saveTts(!ttsEnabled)}
        role="switch"
        aria-checked={ttsEnabled}
        aria-label="Spoken replies"
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left"
      >
        <span>
          <span className="block text-[11.5px] font-semibold">Spoken replies</span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {ttsEnabled ? "Kurukoo speaks replies aloud" : "Voice replies stay silent"}
          </span>
        </span>
        <span
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${ttsEnabled ? "bg-primary" : "bg-elevated"}`}
        >
          <span
            className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-surface shadow transition-all ${ttsEnabled ? "left-[18px]" : "left-[3px]"}`}
          />
        </span>
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/agents"
          onClick={onClose}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-center text-[11px] font-medium hover:bg-elevated"
        >
          Assign / deploy agent
        </Link>
        <Link
          to="/cart"
          onClick={onClose}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-center text-[11px] font-medium hover:bg-elevated"
        >
          Manage connected tools
        </Link>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Voice preferences are saved on this device. Agent assignment controls are routed to the
        existing Agents surface; no deployment is claimed until it is actually completed there.
      </p>
    </div>
  );
}

function ChatPage() {
  const {
    messages,
    send,
    regenerateLast,
    notifyAssistant,
    loadConversation,
    work,
    isSending,
    isLoadingHistory,
    lastError,
    conversationId,
  } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [historyItems, setHistoryItems] = useState<
    Array<{ id: string; title?: string | null; updated_at?: string; channel?: string }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<TopicContext | null>(null);
  const latestRequestIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => {
      const card = message.cardData;
      if (!card) return false;
      const type = String(card.type ?? "").toLowerCase();
      return (
        [
          "request",
          "agentic_storefront",
          "provider_match",
          "provider_card",
          "offer",
          "offer_card",
          "quote",
          "quote_card",
        ].includes(type) &&
        Boolean(
          card.requestId ||
          ["request", "agentic_storefront", "offer", "offer_card", "quote", "quote_card"].includes(
            type,
          ),
        )
      );
    });
  const latestRequest = latestRequestIndex?.message;
  const discoveryQuery = latestRequestIndex
    ? [...messages]
        .slice(0, latestRequestIndex.index)
        .reverse()
        .find((message) => message.role === "you")
        ?.text?.trim() ||
      String(
        latestRequest?.cardData?.objective ??
          latestRequest?.cardData?.product ??
          latestRequest?.cardData?.skill ??
          "",
      )
    : "";
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query")?.trim() ?? "";
    const draft = localStorage.getItem("kurukoo-chat-draft")?.trim() ?? "";
    if (query) {
      setInitialDraft(query);
      const url = new URL(window.location.href);
      url.searchParams.delete("query");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } else if (draft) setInitialDraft(draft);
    if (draft) localStorage.removeItem("kurukoo-chat-draft");
    const openConversation = localStorage.getItem("kurukoo-open-conversation");
    if (openConversation) {
      localStorage.removeItem("kurukoo-open-conversation");
      void loadConversation(openConversation);
    }
    const rawTopic = localStorage.getItem("kurukoo-topic-context");
    if (rawTopic) {
      try {
        setTopicContext(JSON.parse(rawTopic) as TopicContext);
      } catch {
        localStorage.removeItem("kurukoo-topic-context");
      }
    }
    // Signed QR entry (?qr=...): verify server-side via /api/qr/activate, which
    // appends the contextual intro exactly once, then load that conversation.
    // The token is single-use per load: strip it so reloads don't re-activate.
    const qr = params.get("qr")?.trim() ?? "";
    const qrError = params.get("qr_error")?.trim() ?? "";
    if (qr || qrError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("qr");
      url.searchParams.delete("qr_error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    if (qrError) {
      notifyAssistant(
        "That QR code is invalid, expired, or unsupported. Nothing was opened — tell me what you need and we'll start fresh.",
      );
    } else if (qr) {
      void (async () => {
        try {
          const result = await activateQrContext(qr);
          if (result.conversationId) await loadConversation(result.conversationId);
          else if (result.intro) notifyAssistant(result.intro);
        } catch {
          notifyAssistant(
            "This QR context could not be opened — it may be invalid or expired. Tell me what you need and we'll start fresh.",
          );
        }
      })();
    }
  }, [loadConversation, notifyAssistant]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);
  useEffect(() => {
    const open = () => void openHistory();
    window.addEventListener("kurukoo-open-history", open);
    return () => window.removeEventListener("kurukoo-open-history", open);
  }, []);
  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const data = await fetchChatHistory(undefined, 50);
      setHistoryItems(data.conversations ?? []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }
  function clearTopicContext() {
    localStorage.removeItem("kurukoo-topic-context");
    setTopicContext(null);
  }
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1040px] flex-col px-0">
      <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-2 backdrop-blur-xl md:px-0">
        <div className="flex min-w-0 items-center gap-2.5">
          {voiceActive ? (
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] border border-primary/40 bg-primary/10">
              <AudioLines className="size-[17px] text-primary motion-safe:animate-pulse" />
            </span>
          ) : (
            <AgentMark active />
          )}
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold tracking-[-0.01em]">Kurukoo</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {voiceActive ? "Voice: Active" : "Chat: Active"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setSettingsOpen((value) => !value)}
            aria-label="Chat and voice settings"
            aria-expanded={settingsOpen}
            title="Chat and voice settings"
            className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-elevated"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>
      {settingsOpen ? <ChatSettings onClose={() => setSettingsOpen(false)} /> : null}
      {messages.length === 0 ? (
        <main id="kurukoo-chat-surface" className="flex flex-1 flex-col pb-8 pt-5 md:pt-6">
          <div className="mx-auto w-full max-w-[820px]">
            <AgentIntro />
            <div className="mt-4 flex items-start gap-3">
              <AgentMark active />
              <div className="max-w-[760px] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[13.5px] leading-6 shadow-sm">
                <p>Let me know if you'd like me to do any of the following:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isSending}
                      onClick={() => void send(suggestion)}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-left text-[11.5px] font-medium transition-colors hover:border-primary hover:bg-elevated disabled:opacity-40"
                    >
                      {suggestion}
                      <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <AgentMark />
              <div className="max-w-[760px] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[13.5px] leading-6 shadow-sm">
                What would you like to do today?
              </div>
            </div>
          </div>
          <ActiveWork work={work} />
          <div id="kurukoo-voice-card-slot" />
        </main>
      ) : (
        <main id="kurukoo-chat-surface" className="flex-1 space-y-4 py-4 md:py-5">
          <div className="mx-auto max-w-[820px] space-y-5">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                onAction={(action) => {
                  void send(action);
                }}
                onRegenerate={
                  message.role === "kurukoo" && !isSending ? () => regenerateLast() : undefined
                }
                onEdit={
                  message.role === "you" && !isSending
                    ? () => {
                        setInitialDraft(message.text);
                        window.setTimeout(() => {
                          const box = document.getElementById("ask") as HTMLTextAreaElement | null;
                          box?.scrollIntoView({ behavior: "smooth", block: "center" });
                          box?.focus({ preventScroll: true });
                        }, 60);
                      }
                    : undefined
                }
                onCartAdd={(offerId, kind) => {
                  const catalogue = kind === "catalogue";
                  void addCartItem(offerId, 1, catalogue ? "catalogue" : "offer")
                    .then((res) =>
                      notifyAssistant(
                        res.message ||
                          (catalogue
                            ? "Product added to your review cart. Nothing is paid and nothing is ordered — it completes at its destination."
                            : "Offer added to your review cart. Nothing is paid and nothing is ordered yet — review it in your cart when ready."),
                      ),
                    )
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : catalogue
                            ? "Could not add that product. It may no longer be available."
                            : "Could not add that offer. It may no longer be available.",
                      ),
                    );
                }}
                onAdvance={(requestId, actionId) => {
                  if (actionId === "dispute") {
                    void send(`I want to report a problem with request ${requestId}.`);
                    return;
                  }
                  void advanceStorefrontAction(requestId, actionId, { conversationId })
                    .then(() => {
                      if (conversationId) void loadConversation(conversationId);
                    })
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : "Could not advance that request. No state was changed.",
                      ),
                    );
                }}
                onOfferSelect={(fulfilmentId, offerId) => {
                  void selectFulfilmentOffer(fulfilmentId, offerId)
                    .then((res) =>
                      notifyAssistant(
                        res.message ||
                          `Offer${res.offerTitle ? ` “${res.offerTitle}”` : ""} selected. Awaiting confirmation — nothing is booked or paid.`,
                      ),
                    )
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : "Could not select that offer. No state was changed.",
                      ),
                    );
                }}
                onReview={(requestId, providerPhone, rating) => {
                  void submitServiceReview(requestId, providerPhone, rating)
                    .then(() => notifyAssistant("Review recorded. Thank you."))
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : "Could not record that review. No state was changed.",
                      ),
                    );
                }}
                onEmailSend={(draft) => {
                  void sendComposedEmail(draft)
                    .then((res) => notifyAssistant(res.message || "Email sent."))
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : "Email was not sent. No state was changed.",
                      ),
                    );
                }}
                onFormSubmit={(schemaId, values) => {
                  void submitFormPacket(schemaId, values)
                    .then((res) =>
                      notifyAssistant(
                        res.message ||
                          "Form packet recorded as prepared evidence. Filing with the authority still requires an authorised channel.",
                      ),
                    )
                    .catch((error: unknown) =>
                      notifyAssistant(
                        error instanceof Error
                          ? error.message
                          : "Could not file that form. No state was changed.",
                      ),
                    );
                }}
              />
            ))}
          </div>
          {latestRequest ? (
            <ChatDiscovery
              query={discoveryQuery}
              onReview={(prompt) => {
                void send(prompt);
              }}
            />
          ) : null}
          <ActiveWork work={work} />
          <div id="kurukoo-voice-card-slot" />
          <div ref={endRef} />
        </main>
      )}
      {lastError ? (
        <p role="alert" className="pb-1 text-center text-[12px] text-destructive">
          {lastError}
        </p>
      ) : null}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background to-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-[980px]">
          <p className="mb-1.5 text-center text-[10.5px] text-muted-foreground">
            Say “Hey Kurukoo” in voice mode, or type what needs doing.
          </p>
          {topicContext ? (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-[11.5px]">
              <Sparkles className="size-3.5 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 truncate text-muted-foreground">
                <span className="font-medium text-foreground">Recalled context:</span>{" "}
                {topicContext.title}
                {topicContext.category ? ` · ${topicContext.category}` : ""}
                {topicContext.city ? ` · ${topicContext.city}` : ""}
              </p>
              <button
                type="button"
                onClick={clearTopicContext}
                aria-label="Clear recalled context"
                className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-elevated"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Composer
                onSend={send}
                disabled={isSending}
                initialValue={initialDraft}
                voiceOverlayTargetId="kurukoo-voice-card-slot"
                showLocationAction={false}
                showDictation={false}
                onVoiceStateChange={setVoiceActive}
                voiceConversationId={conversationId ?? undefined}
              />
            </div>
          </div>
        </div>
      </div>
      {historyOpen ? (
        <aside
          aria-label="Conversation history"
          className="fixed bottom-0 left-0 top-[50px] z-[80] flex w-[min(360px,92vw)] flex-col bg-surface p-4 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Your conversations
              </p>
              <h2 className="mt-1 text-[18px] font-semibold">History</h2>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close history"
              className="grid size-9 place-items-center rounded-full hover:bg-elevated"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            Pick up where you left off. Kurukoo keeps the conversation context so you don't have to
            start again.
          </p>
          <div className="mt-4 min-h-[160px] max-h-[calc(100vh-260px)] flex-1 space-y-1.5 overflow-y-auto">
            {historyLoading ? (
              <div className="h-16 animate-pulse bg-elevated" />
            ) : historyItems.length ? (
              historyItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setHistoryOpen(false);
                    void loadConversation(item.id);
                  }}
                  className="w-full border border-border px-3 py-3 text-left hover:bg-elevated"
                >
                  <p className="truncate text-[12px] font-medium">
                    {item.title || "Untitled conversation"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.channel || "web"}
                    {item.updated_at ? ` · ${new Date(item.updated_at).toLocaleString()}` : ""}
                  </p>
                </button>
              ))
            ) : (
              <div className="border border-dashed border-border px-3 py-4 text-[11.5px] text-muted-foreground">
                No saved conversations yet.
              </div>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
