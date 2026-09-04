import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Message } from "@/components/kurukoo/primitives";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Kurukoo — Ask, and it gets done" },
      {
        name: "description",
        content:
          "Tell Kurukoo what you need. It understands, takes care of the work, and comes back to you with progress and results.",
      },
      { property: "og:title", content: "Kurukoo — Ask, and it gets done" },
      {
        property: "og:description",
        content: "A conversation-first assistant that handles requests end to end.",
      },
      { property: "og:url", content: "/chat" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/chat" }],
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
  ["Find someone", "Tradespeople, clinics, specialists, local businesses."],
  ["Arrange something", "Times, quotes, bookings — checked with you first."],
  ["Chase and follow up", "Kurukoo keeps track so you don't have to."],
  ["Keep the thread", "Every request stays readable in Work."],
];

function ChatPage() {
  const { messages, send, work } = useKurukoo();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const active = work.filter((w) => w.stage !== "done");

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center py-10">
          <h1 className="text-[30px] font-semibold leading-tight md:text-[38px]">
            What do you need done?
          </h1>
          <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
            Say it plainly. Kurukoo works it out, does the running around, and comes back to you.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {suggestions.map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="min-h-9 rounded-full border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {capabilities.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-surface px-4 py-3.5">
                <p className="text-[14.5px] font-medium">{title}</p>
                <p className="mt-0.5 text-[13.5px] text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Not sure where to start?{" "}
            <Link to="/explore" className="underline">
              Explore what's around you
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-5 py-4">
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {active.length > 0 ? (
            <section
              aria-label="In progress"
              className="rounded-xl border border-border bg-surface px-4 py-3"
            >
              <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
                In progress
              </p>
              <ul className="mt-2 space-y-1.5">
                {active.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-4 text-[14.5px]">
                    <Link to="/work/$workId" params={{ workId: w.id }} className="truncate">
                      {w.title}
                    </Link>
                    <span className="shrink-0 text-[13px] text-muted-foreground">{w.updated}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div ref={endRef} />
        </div>
      )}

      <Composer onSend={send} />
    </div>
  );
}
