import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History, MessageCircle, Sparkles, X, ShieldCheck, CircleDot, ChevronRight, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { ChatDiscovery } from "@/components/kurukoo/chat-discovery";
import { fetchChatHistory } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({ head: () => ({ meta: [{ title: "Croon — Kurukoo" }, { name: "description", content: "Talk to Kurukoo and tell it what needs doing." }, { name: "robots", content: "noindex" }] }), component: ChatPage });

const suggestions = ["Get me a ride.", "Find someone to fix my phone.", "Find a trusted plumber.", "Order something for me.", "Plan my day."];
type TopicContext = { id: string; slug: string; title: string; type: string; category: string | null; city: string | null; lga: string | null };

function AgentMark({ active = false }: { active?: boolean }) {
  return <span className={`relative grid size-10 shrink-0 place-items-center rounded-[13px] border ${active ? "border-primary/25 bg-primary/10" : "border-border bg-elevated"}`} aria-hidden="true">
    <Sparkles className={`size-[18px] ${active ? "text-primary" : "text-foreground/70"}`} strokeWidth={1.7} />
    <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${active ? "bg-primary" : "bg-[var(--color-success)]"}`} />
  </span>;
}

function ActiveWork({ work }: { work: ReturnType<typeof useKurukoo>["work"] }) {
  const active = work.filter((item) => item.stage !== "done");
  if (!active.length) return null;
  return <section aria-label="Kurukoo is taking care of" className="mx-auto mt-4 w-full max-w-[820px] border-y border-border py-3">
    <div className="flex items-center gap-2 text-[11px] font-medium"><Clock3 className="size-3.5 text-primary" /> Kurukoo is taking care of</div>
    <div className="mt-2 divide-y divide-border/70">
      {active.slice(0, 3).map((item) => <Link key={item.id} to="/work/$workId" params={{ workId: item.id }} className="group flex items-center gap-3 py-2.5 hover:bg-elevated/50">
        <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.title}</span>
        <span className="shrink-0 text-[10.5px] text-muted-foreground">{item.updated}</span>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>)}
    </div>
  </section>;
}

function ChatPage() {
  const { messages, send, loadConversation, work, isSending, isLoadingHistory, lastError } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; title?: string | null; updated_at?: string; channel?: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<TopicContext | null>(null);
  const latestRequestIndex = [...messages].map((message, index) => ({ message, index })).reverse().find(({ message }) => {
    const card = message.cardData;
    if (!card) return false;
    const type = String(card.type ?? "").toLowerCase();
    return ["request", "agentic_storefront", "provider_match", "provider_card", "offer", "offer_card", "quote", "quote_card"].includes(type) && Boolean(card.requestId || ["request", "agentic_storefront", "offer", "offer_card", "quote", "quote_card"].includes(type));
  });
  const latestRequest = latestRequestIndex?.message;
  const discoveryQuery = latestRequestIndex ? [...messages].slice(0, latestRequestIndex.index).reverse().find((message) => message.role === "you")?.text?.trim() || String(latestRequest?.cardData?.objective ?? latestRequest?.cardData?.product ?? latestRequest?.cardData?.skill ?? "") : "";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("query")?.trim() ?? "";
    const draft = localStorage.getItem("kurukoo-chat-draft")?.trim() ?? "";
    if (query) setInitialDraft(query);
    else if (draft) setInitialDraft(draft);
    if (draft) localStorage.removeItem("kurukoo-chat-draft");
    const openConversation = localStorage.getItem("kurukoo-open-conversation");
    if (openConversation) { localStorage.removeItem("kurukoo-open-conversation"); void loadConversation(openConversation); }
    const rawTopic = localStorage.getItem("kurukoo-topic-context");
    if (rawTopic) { try { setTopicContext(JSON.parse(rawTopic) as TopicContext); } catch { localStorage.removeItem("kurukoo-topic-context"); } }
  }, [loadConversation]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  async function openHistory() {
    setHistoryOpen(true); setHistoryLoading(true);
    try { const data = await fetchChatHistory(undefined, 50); setHistoryItems(data.conversations ?? []); }
    catch { setHistoryItems([]); }
    finally { setHistoryLoading(false); }
  }
  function clearTopicContext() { localStorage.removeItem("kurukoo-topic-context"); setTopicContext(null); }

  return <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1040px] flex-col">
    <header className="sticky top-0 z-20 -mx-3 flex items-center justify-between border-b border-border/70 bg-background/92 px-3 py-3 backdrop-blur-xl md:-mx-5 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/workspace" aria-label="Back to Perch" title="Back to Perch" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-elevated"><ArrowLeft className="size-[18px]" /></Link>
        <AgentMark active={isSending} />
        <div className="min-w-0"><div className="flex items-center gap-2"><p className="text-[14px] font-semibold tracking-[-0.01em]">Croon</p><span className="border-l border-border pl-2 text-[9.5px] text-muted-foreground">Talk to Kurukoo</span></div><p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><CircleDot className={`size-2.5 ${isSending ? "animate-pulse text-primary" : "text-[var(--color-success)]"}`} />{isSending ? "Working on it" : isLoadingHistory ? "Getting your context" : "Here when you need me"}</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden items-center gap-1.5 border-r border-border pr-3 text-[9.5px] text-muted-foreground sm:flex"><ShieldCheck className="size-3.5 text-primary" /> You stay in control</div>
        <button type="button" onClick={() => void openHistory()} aria-label="Open conversation history" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><History className="size-4.5" /></button>
      </div>
    </header>

    {topicContext ? <section className="mt-3 border border-border bg-surface px-3.5 py-2.5"><div className="flex items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center bg-elevated"><MessageCircle className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="text-[10.5px] text-muted-foreground">Using context from</p><Link to="/topics/$slug" params={{ slug: topicContext.slug }} className="block truncate text-[12.5px] font-medium hover:underline">{topicContext.title}</Link></div><button type="button" onClick={clearTopicContext} aria-label="Clear Topic context" className="grid size-7 place-items-center text-muted-foreground hover:bg-elevated"><X className="size-3.5" /></button></div></section> : null}

    {messages.length === 0 ? <main className="flex flex-1 flex-col justify-center pb-10 pt-8 md:pt-[clamp(2rem,11vh,7rem)]">
      <div className="mx-auto w-full max-w-[820px]">
        <div className="flex items-center gap-3"><AgentMark /><div><p className="text-[12px] font-medium text-primary">Croon</p><p className="text-[10.5px] text-muted-foreground">Talk to Kurukoo in your own words, by typing or by voice.</p></div></div>
        <h1 className="mt-7 max-w-[780px] text-[42px] font-semibold leading-[1.01] tracking-[-0.055em] md:text-[68px]">What needs doing?</h1>
        <p className="mt-5 max-w-[650px] text-[15px] leading-7 text-muted-foreground">You don't need to know the right service, provider or next step. Start with the outcome. Kurukoo can work through the route, involve you when a decision matters, and show you what actually happened.</p>
        <div className="mt-8 border-y border-border">
          <div className="grid md:grid-cols-3">
            <div className="border-b border-border py-4 md:border-b-0 md:border-r md:pr-6"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">You say it</p><p className="mt-1.5 text-[12.5px] leading-5">Describe the result you want, in your own words.</p></div>
            <div className="border-b border-border py-4 md:border-b-0 md:border-r md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kurukoo works</p><p className="mt-1.5 text-[12.5px] leading-5">Find the right route, people, places, tools or services.</p></div>
            <div className="py-4 md:pl-6"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">You decide</p><p className="mt-1.5 text-[12.5px] leading-5">Nothing consequential is committed without the control you need.</p></div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={isSending} onClick={() => void send(suggestion)} className="group inline-flex items-center gap-1.5 border-b border-border py-1.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40">{suggestion}<ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" /></button>)}</div>
      </div>
      <ActiveWork work={work} />
    </main> : <main className="flex-1 space-y-5 py-5 md:py-7">
      <div className="mx-auto flex max-w-[820px] items-center gap-2.5 px-1"><AgentMark active={isSending} /><div><p className="text-[11px] font-medium">Croon</p><p className="text-[10px] text-muted-foreground">{isSending ? "Working through this with you" : "I'm here. Keep going."}</p></div></div>
      <div className="mx-auto max-w-[820px] space-y-5">{messages.map((message) => <Message key={message.id} message={message} onAction={(action) => { void send(action); }} />)}</div>
      {latestRequest ? <ChatDiscovery query={discoveryQuery} onReview={(prompt) => { void send(prompt); }} /> : null}
      <ActiveWork work={work} />
      <div ref={endRef} />
    </main>}

    {lastError ? <p role="alert" className="pb-1 text-center text-[12px] text-destructive">{lastError}</p> : null}
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-5"><div className="mx-auto max-w-[980px]"><p className="mb-2 text-center text-[10.5px] text-muted-foreground">Say “Hey Kurukoo” in voice mode, or type what needs doing.</p><Composer onSend={send} disabled={isSending} initialValue={initialDraft} /></div></div>

    {historyOpen ? <div className="fixed inset-0 z-[90] bg-foreground/15 backdrop-blur-[1px]" onClick={() => setHistoryOpen(false)}><aside aria-label="Conversation history" className="absolute bottom-0 left-0 top-0 w-[min(380px,92vw)] border-r border-border bg-surface p-4 shadow-[var(--shadow-lift)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Your conversations</p><h2 className="mt-1 text-[18px] font-semibold">History</h2></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close history" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><X className="size-4" /></button></div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">Pick up where you left off. Kurukoo keeps the conversation context so you don't have to start again.</p><div className="mt-4 space-y-1.5">{historyLoading ? <div className="h-16 animate-pulse bg-elevated" /> : historyItems.length ? historyItems.map((item) => <button type="button" key={item.id} onClick={() => { setHistoryOpen(false); void loadConversation(item.id); }} className="w-full border border-border px-3 py-3 text-left hover:bg-elevated"><p className="truncate text-[12px] font-medium">{item.title || "Untitled conversation"}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.channel || "web"}{item.updated_at ? ` · ${new Date(item.updated_at).toLocaleString()}` : ""}</p></button>) : <div className="border border-dashed border-border px-3 py-4 text-[11.5px] text-muted-foreground">No saved conversations yet.</div>}</div></aside></div> : null}
  </div>;
}