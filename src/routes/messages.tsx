import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, Rows, StatTile } from "@/components/kurukoo/ui";
import { entityById, threads } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Kurukoo" },
      { name: "description", content: "Direct conversations with providers and businesses, tied to your work." },
      { property: "og:title", content: "Messages — Kurukoo" },
      { property: "og:description", content: "Talk directly to the people doing the work." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [query, setQuery] = useState("");
  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const who = entityById(t.withId);
      return `${who?.name ?? ""} ${t.subject} ${t.messages[t.messages.length - 1]?.text ?? ""}`.toLowerCase().includes(q);
    });
  }, [query]);
  const unread = threads.reduce((sum, t) => sum + (t.unread ?? 0), 0);

  return (
    <>
      <PageHeader title="Messages" subtitle="Direct threads, always linked back to the work." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Conversations" value={`${threads.length}`} note="Active threads" />
        <StatTile label="Unread" value={`${unread}`} note="Needs your attention" />
        <StatTile label="Linked to work" value={`${threads.length}`} note="Context stays attached" />
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="message-search" className="sr-only">Search messages</label>
        <input id="message-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <section className="mt-5">
        {visibleThreads.length === 0 ? (
          <EmptyState title="No conversations found" body="Try another name, subject or message." />
        ) : (
          <Rows>
            {visibleThreads.map((t) => {
              const who = entityById(t.withId);
              const last = t.messages[t.messages.length - 1];
              return (
                <li key={t.id}>
                  <Link to="/messages/$threadId" params={{ threadId: t.id }} className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated">
                    <Avatar name={who?.name ?? "?"} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-medium">{who?.name ?? "Conversation"}</span>
                        {t.unread ? <Badge tone="accent">{t.unread} new</Badge> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{t.subject}</span>
                      <span className="mt-1 block truncate text-[13px] text-muted-foreground">{last?.text}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">{t.when}<MessageSquare className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
                  </Link>
                </li>
              );
            })}
          </Rows>
        )}
      </section>

      <IntegrationGap>
        Threads are demo content. Real delivery will connect here to approved messaging channels and provider conversations.
      </IntegrationGap>
    </>
  );
}
