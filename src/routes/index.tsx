import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useKurukoo } from "@/lib/kurukoo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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
    ],
  }),
  component: HomePage,
});

const suggestions = [
  "Find me a plumber.",
  "Book me a dentist.",
  "I need someone to repair my phone.",
  "What am I waiting for?",
];

function HomePage() {
  const { messages, send, work } = useKurukoo();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = (text: string) => {
    send(text);
    setDraft("");
  };

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
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-5 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "you" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] text-[15px] leading-relaxed",
                  m.role === "you"
                    ? "rounded-2xl rounded-br-md bg-elevated px-4 py-2.5"
                    : "text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {active.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <p className="text-[12px] uppercase tracking-wide text-muted-foreground">In progress</p>
              <ul className="mt-2 space-y-1.5">
                {active.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-4 text-[14.5px]">
                    <span className="truncate">{w.title}</span>
                    <span className="shrink-0 text-[13px] text-muted-foreground">{w.updated}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        className="sticky bottom-20 mt-4 flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)] md:bottom-6"
      >
        <label htmlFor="ask" className="sr-only">
          Ask Kurukoo
        </label>
        <input
          id="ask"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Kurukoo…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-35"
        >
          <ArrowUp className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}
