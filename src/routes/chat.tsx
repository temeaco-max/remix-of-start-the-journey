import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Conversation — Kurukoo" },
      {
        name: "description",
        content: "Tell Kurukoo what you need and keep the whole request in one conversation.",
      },
      { property: "og:title", content: "Conversation — Kurukoo" },
      {
        property: "og:description",
        content: "A conversation-first assistant that helps carry requests forward.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});
const suggestions = [
  "Find me a plumber.",
  "Book me a dentist.",
  "I need someone to repair my phone.",
  "What am I waiting for?",
];
const capabilities = [
  ["Find someone", "Tradespeople, clinics, specialists and local businesses."],
  ["Arrange something", "Times, quotes and bookings — checked with you first."],
  ["Chase and follow up", "Kurukoo keeps track so you do not have to."],
  ["Keep the thread", "Every request stays readable in Work."],
];
function ChatPage() {
  const { messages, send, work, isSending, isLoadingHistory, lastError } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const active = work.filter((w) => w.stage !== "done");
  useEffect(() => {
    const draft = localStorage.getItem("kurukoo-chat-draft");
    if (draft) {
      setInitialDraft(draft);
      localStorage.removeItem("kurukoo-chat-draft");
    }
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[820px] flex-col">
      <header className="flex items-center justify-between border-b border-border py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label="Back to Home"
            className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-elevated"
          >
            <ArrowLeft className="size-[18px]" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold">Kurukoo</p>
              <Sparkles className="size-[16px] shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
              {isLoadingHistory
                ? "Checking your conversation"
                : messages.length
                  ? isSending
                    ? "Kurukoo is working"
                    : "Conversation active"
                  : "Your conversation"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
            <ShieldCheck className="mr-1.5 size-3.5" />
            In control
          </span>
          <Link
            to="/work"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            Work <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-start pb-10 pt-[clamp(1.5rem,8vh,5rem)]">
          <p className="text-[12px] font-medium text-muted-foreground">
            {isSending
              ? "Working"
              : isLoadingHistory
                ? "Loading your conversation"
                : "Ready when you are"}
          </p>
          <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.035em] md:text-[38px]">
            What do you need done?
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Say it plainly. Kurukoo works out the useful next step, keeps you informed and asks
            before anything important is committed.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isSending}
                onClick={() => send(s)}
                className="min-h-9 rounded-full border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {capabilities.map(([title, body]) => (
              <Panel key={title} className="p-4">
                <p className="text-[14.5px] font-medium">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              </Panel>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <CircleHelp className="size-3.5" />
            Not sure where to start?{" "}
            <Link
              to="/explore"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Explore what is around you
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-5 py-4">
          <div className="mx-auto h-0 max-w-xl" />
          {messages.map((m) => (
            <Message key={m.id} message={m} onAction={(action) => { void send(action); }} />
          ))}
          {active.length > 0 ? (
            <section
              aria-label="In progress"
              className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--color-success)]" />
                <p className="text-[12px] font-medium">Kurukoo is working</p>
              </div>
              <ul className="mt-3 space-y-2">
                {active.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-4 text-[13.5px]">
                    <Link
                      to="/work/$workId"
                      params={{ workId: w.id }}
                      className="truncate font-medium hover:underline"
                    >
                      {w.title}
                    </Link>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{w.updated}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div ref={endRef} />
        </div>
      )}
      {lastError ? (
        <p role="alert" className="pb-1 text-center text-[12px] text-destructive">
          {lastError}
        </p>
      ) : null}
      <div className="sticky bottom-0 bg-background pb-3 pt-3">
        <Composer onSend={send} disabled={isSending} initialValue={initialDraft} />
        <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
          Kurukoo will ask for your approval before commitments, payments or important actions.
        </p>
      </div>
    </div>
  );
}
