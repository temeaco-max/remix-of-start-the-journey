import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleHelp, History, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { fetchChatHistory } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Conversation — Kurukoo" },
      { name: "description", content: "Tell Kurukoo what you need and keep the whole request in one conversation." },
      { property: "og:title", content: "Conversation — Kurukoo" },
      { property: "og:description", content: "A conversation-first assistant that helps carry requests forward." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});
const suggestions = ["Find me a plumber.", "Book me a dentist.", "I need someone to repair my phone.", "What am I waiting for?"];
const capabilities = [
  ["Find someone", "Tradespeople, clinics, specialists and local businesses."],
  ["Arrange something", "Times, quotes and bookings — checked with you first."],
  ["Chase and follow up", "Kurukoo keeps track so you do not have to."],
  ["Keep the thread", "Every request stays readable in Work."],
];
type TopicContext = { id: string; slug: string; title: string; type: string; category: string | null; city: string | null; lga: string | null };
function ChatPage() {
  const { messages, send, loadConversation, work, isSending, isLoadingHistory, lastError } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; title?: string | null; updated_at?: string; channel?: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<TopicContext | null>(null);
  const active = work.filter((w) => w.stage !== "done");

  useEffect(() => {
    const draft = localStorage.getItem("kurukoo-chat-draft");
    if (draft) {
      setInitialDraft(draft);
      localStorage.removeItem("kurukoo-chat-draft");
    }
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
  }, [loadConversation]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  function clearTopicContext() {
    localStorage.removeItem("kurukoo-topic-context");
    setTopicContext(null);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[820px] flex-col">
      <header className="flex items-center justify-between border-b border-border py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Back to Home" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-elevated"><ArrowLeft className="size-[18px]" /></Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="text-[14px] font-semibold">Kurukoo</p><Sparkles className="size-[16px] shrink-0 text-muted-foreground" aria-hidden /></div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground"><span className="size-1.5 rounded-full bg-[var(--color-success)]" />{isLoadingHistory ? "Checking your conversation" : messages.length ? isSending ? "Kurukoo is working" : "Conversation active" : "Your conversation"}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={async () => { setHistoryOpen(true); setHistoryLoading(true); try { const data = await fetchChatHistory(undefined, 50); setHistoryItems(data.conversations ?? []); } catch { setHistoryItems([]); } finally { setHistoryLoading(false); } }} aria-label="Open conversation history" title="Conversation history" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><History className="size-4.5" /></button>
          <span className="hidden rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex"><ShieldCheck className="mr-1.5 size-3.5" />In control</span>
          <Link to="/work" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">Work <ArrowUpRight className="size-3.5" /></Link>
        </div>
      </header>
      {topicContext ? (
        <section className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-soft)]" aria-label="Topic context">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-elevated"><MessageCircle className="size-3.5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">Using context from Topic</p>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-muted-foreground">{topicContext.type.replace(/[_-]/g, " ")}</span>
              </div>
              <Link to="/topics/$slug" params={{ slug: topicContext.slug }} className="mt-0.5 block truncate text-[13px] font-medium hover:underline">{topicContext.title}</Link>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Community context only. It can inform this conversation, but it is not proof of a provider, price, stock or availability.</p>
            </div>
            <button type="button" onClick={clearTopicContext} aria-label="Clear Topic context" title="Clear Topic context" className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-elevated"><X className="size-3.5" /></button>
          </div>
        </section>
      ) : null}
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-start pb-10 pt-[clamp(1.5rem,8vh,5rem)]">
          <p className="text-[12px] font-medium text-muted-foreground">{isSending ? "Working" : isLoadingHistory ? "Loading your conversation" : "Ready when you are"}</p>
          <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.035em] md:text-[38px]">What do you need done?</h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">Say it plainly. Kurukoo works out the useful next step, keeps you informed and asks before anything important is committed.</p>
          <div className="mt-7 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" disabled={isSending} onClick={() => send(s)} className="min-h-9 rounded-full border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground disabled:opacity-40">{s}</button>)}</div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">{capabilities.map(([title, body]) => <Panel key={title} className="p-4"><p className="text-[14.5px] font-medium">{title}</p><p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p></Panel>)}</div>
          <p className="mt-5 flex items-center gap-1.5 text-[12px] text-muted-foreground"><CircleHelp className="size-3.5" />Not sure where to start? <Link to="/explore" className="font-medium text-foreground underline underline-offset-2">Explore what is around you</Link>.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-5 py-4">
          <div className="mx-auto h-0 max-w-xl" />
          {messages.map((m) => <Message key={m.id} message={m} onAction={(action) => { void send(action); }} />)}
          {active.length > 0 ? <section aria-label="In progress" className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-soft)]"><div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--color-success)]" /><p className="text-[12px] font-medium">Kurukoo is working</p></div><ul className="mt-3 space-y-2">{active.map((w) => <li key={w.id} className="flex items-center justify-between gap-4 text-[13.5px]"><Link to="/work/$workId" params={{ workId: w.id }} className="truncate font-medium hover:underline">{w.title}</Link><span className="shrink-0 text-[12px] text-muted-foreground">{w.updated}</span></li>)}</ul></section> : null}
          <div ref={endRef} />
        </div>
      )}
      {lastError ? <p role="alert" className="pb-1 text-center text-[12px] text-destructive">{lastError}</p> : null}
      {historyOpen ? <div className="fixed inset-0 z-[90] bg-foreground/15 backdrop-blur-[1px]" onClick={() => setHistoryOpen(false)}><aside aria-label="Conversation history" className="absolute bottom-0 left-0 top-0 w-[min(340px,90vw)] border-r border-border bg-surface p-4 shadow-[var(--shadow-lift)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Conversation</p><h2 className="mt-1 text-[18px] font-semibold">History</h2></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close history" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><X className="size-4" /></button></div><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Your text and voice turns stay in the same Kurukoo conversation history.</p><div className="mt-4 space-y-1.5">{historyLoading ? <div className="h-16 animate-pulse rounded-xl bg-elevated" /> : historyItems.length ? historyItems.map((item) => <button type="button" key={item.id} onClick={() => { setHistoryOpen(false); void loadConversation(item.id); }} className="w-full rounded-xl border border-border px-3 py-3 text-left hover:bg-elevated"><p className="truncate text-[12px] font-medium">{item.title || "Untitled conversation"}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.channel || "web"}{item.updated_at ? ` · ${new Date(item.updated_at).toLocaleString()}` : ""}</p></button>) : <div className="rounded-xl border border-dashed border-border px-3 py-4 text-[11.5px] leading-relaxed text-muted-foreground">No saved conversations are available yet.</div>}</div></aside></div> : null}
      <div className="sticky bottom-0 bg-background pb-3 pt-3"><Composer onSend={send} disabled={isSending} initialValue={initialDraft} /><p className="mt-2 text-center text-[10.5px] text-muted-foreground">Kurukoo will ask for your approval before commitments, payments or important actions.</p></div>
    </div>
  );
}
