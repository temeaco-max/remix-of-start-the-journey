import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle2, History, MessageCircle, Sparkles, X, ShieldCheck, CircleDot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { ChatDiscovery } from "@/components/kurukoo/chat-discovery";
import { fetchChatHistory } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Conversation — Kurukoo" },
      { name: "description", content: "Tell Kurukoo what you need." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

const suggestions = ["Find someone to fix my phone.", "Get me a ride.", "Find a trusted plumber.", "Order something for me.", "Plan what I need to do today.", "Show me what I'm waiting for."];
type TopicContext = { id: string; slug: string; title: string; type: string; category: string | null; city: string | null; lga: string | null };

function AgentMark({ active = false }: { active?: boolean }) {
  return <span className={`relative grid size-10 shrink-0 place-items-center rounded-[14px] border ${active ? "border-primary/20 bg-primary/10" : "border-border bg-elevated"}`} aria-hidden="true">
    <Sparkles className={`size-[18px] ${active ? "text-primary" : "text-foreground/70"}`} strokeWidth={1.7} />
    {active ? <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-[var(--color-success)]" /> : null}
  </span>;
}

function ChatPage() {
  const { messages, send, loadConversation, work, isSending, isLoadingHistory, lastError } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; title?: string | null; updated_at?: string; channel?: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<TopicContext | null>(null);
  const active = work.filter((w) => w.stage !== "done");
  const latestRequest = [...messages].reverse().find((message) => message.cardData?.type === "request");
  const discoveryQuery = latestRequest?.cardData ? String(latestRequest.cardData.title ?? latestRequest.cardData.skill ?? "") : "";

  useEffect(() => {
    const draft = localStorage.getItem("kurukoo-chat-draft");
    if (draft) { setInitialDraft(draft); localStorage.removeItem("kurukoo-chat-draft"); }
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

  return <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[900px] flex-col">
    <header className="sticky top-0 z-20 -mx-3 flex items-center justify-between border-b border-border/70 bg-background/92 px-3 py-3 backdrop-blur-xl md:-mx-5 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" aria-label="Back to Home" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-elevated"><ArrowLeft className="size-[18px]" /></Link>
        <AgentMark active={isSending} />
        <div className="min-w-0"><div className="flex items-center gap-2"><p className="text-[14px] font-semibold tracking-[-0.01em]">Kurukoo</p><span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Your AI</span></div><p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><CircleDot className={`size-2.5 ${isSending ? "animate-pulse text-primary" : "text-[var(--color-success)]"}`} />{isSending ? "Working on it" : isLoadingHistory ? "Getting your context" : messages.length ? "Here with you" : "Ready when you are"}</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-surface px-2.5 py-1.5 text-[9.5px] text-muted-foreground sm:flex"><ShieldCheck className="size-3.5 text-primary" /> You stay in control</div>
        <button type="button" onClick={() => void openHistory()} aria-label="Open conversation history" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><History className="size-4.5" /></button>
        <Link to="/work" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-[11px] font-medium hover:bg-elevated">Work <ArrowUpRight className="size-3.5" /></Link>
      </div>
    </header>

    {topicContext ? <section className="mt-3 rounded-xl border border-border bg-surface px-3.5 py-2.5"><div className="flex items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-elevated"><MessageCircle className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="text-[10.5px] text-muted-foreground">Continuing from Topic</p><Link to="/topics/$slug" params={{ slug: topicContext.slug }} className="block truncate text-[12.5px] font-medium hover:underline">{topicContext.title}</Link></div><button type="button" onClick={clearTopicContext} aria-label="Clear Topic context" className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-elevated"><X className="size-3.5" /></button></div></section> : null}

    {messages.length === 0 ? <div className="flex flex-1 flex-col justify-center pb-12 pt-8 md:pt-[clamp(2rem,10vh,7rem)]">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="flex items-center gap-3"><AgentMark /><div><p className="text-[12px] font-medium text-primary">Your Kurukoo</p><p className="text-[10.5px] text-muted-foreground">A personal AI that can help move things forward.</p></div></div>
        <h1 className="mt-6 max-w-[720px] font-serif text-[38px] leading-[1.04] tracking-[-0.045em] md:text-[56px]">What would you like to get done?</h1>
        <p className="mt-4 max-w-[650px] text-[15px] leading-7 text-muted-foreground">Just tell me what you need. You don't need to know the category, the provider or the next step — I'll work that out with you.</p>
        <div className="mt-7 grid gap-2 sm:grid-cols-3">
          {["Understand what I need", "Find the right route", "Keep me in control"].map((title, i) => <div key={title} className="rounded-2xl border border-border/80 bg-surface/75 px-3.5 py-3.5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">0{i + 1}</p><p className="mt-1.5 text-[12.5px] font-medium">{title}</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{["Turn a plain-language request into a clear outcome.", "Use supported people, places, providers and tools.", "Ask before consequential actions and show the result."][i]}</p></div>)}
        </div>
        <div className="mt-7 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" disabled={isSending} onClick={() => send(s)} className="min-h-9 rounded-full border border-border bg-surface px-3.5 py-2 text-[12.5px] text-muted-foreground transition-all hover:-translate-y-px hover:border-primary/35 hover:bg-elevated hover:text-foreground disabled:opacity-40">{s}</button>)}</div>
      </div>
    </div> : <div className="flex-1 space-y-5 py-5 md:py-7">
      <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-1"><AgentMark active={isSending} /><div><p className="text-[11px] font-medium">Kurukoo</p><p className="text-[10px] text-muted-foreground">{isSending ? "Working through this with you" : "Conversation"}</p></div></div>
      {messages.map((m) => <Message key={m.id} message={m} onAction={(action) => { void send(action); }} />)}
      {latestRequest ? <ChatDiscovery query={discoveryQuery} onReview={(prompt) => { void send(prompt); }} /> : null}
      {active.length > 0 ? <section aria-label="In progress" className="mx-auto max-w-[760px] rounded-2xl border border-border bg-surface px-4 py-4"><div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--color-success)]" /><p className="text-[12px] font-medium">Working on this</p></div><ul className="mt-3 space-y-2">{active.map((w) => <li key={w.id} className="flex items-center justify-between gap-4 text-[13.5px]"><Link to="/work/$workId" params={{ workId: w.id }} className="truncate font-medium hover:underline">{w.title}</Link><span className="shrink-0 text-[12px] text-muted-foreground">{w.updated}</span></li>)}</ul></section> : null}
      <div ref={endRef} />
    </div>}

    {lastError ? <p role="alert" className="pb-1 text-center text-[12px] text-destructive">{lastError}</p> : null}
    {historyOpen ? <div className="fixed inset-0 z-[90] bg-foreground/15 backdrop-blur-[1px]" onClick={() => setHistoryOpen(false)}><aside aria-label="Conversation history" className="absolute bottom-0 left-0 top-0 w-[min(340px,90vw)] border-r border-border bg-surface p-4 shadow-[var(--shadow-lift)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Conversation</p><h2 className="mt-1 text-[18px] font-semibold">History</h2></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close history" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><X className="size-4" /></button></div><div className="mt-4 space-y-1.5">{historyLoading ? <div className="h-16 animate-pulse rounded-xl bg-elevated" /> : historyItems.length ? historyItems.map((item) => <button type="button" key={item.id} onClick={() => { setHistoryOpen(false); void loadConversation(item.id); }} className="w-full rounded-xl border border-border px-3 py-3 text-left hover:bg-elevated"><p className="truncate text-[12px] font-medium">{item.title || "Untitled conversation"}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.channel || "web"}{item.updated_at ? ` · ${new Date(item.updated_at).toLocaleString()}` : ""}</p></button>) : <div className="rounded-xl border border-dashed border-border px-3 py-4 text-[11.5px] text-muted-foreground">No saved conversations yet.</div>}</div></aside></div> : null}
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-5"><div className="mx-auto max-w-[900px]"><Composer onSend={send} disabled={isSending} initialValue={initialDraft} /></div></div>
  </div>;
}
