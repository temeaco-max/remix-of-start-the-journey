import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, Rows } from "@/components/kurukoo/ui";
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
  return (
    <>
      <PageHeader title="Messages" subtitle="Direct threads, always linked back to the work." />
      <Rows>
        {threads.map((t) => {
          const who = entityById(t.withId);
          return (
            <li key={t.id}>
              <Link
                to="/messages/$threadId"
                params={{ threadId: t.id }}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-elevated"
              >
                <Avatar name={who?.name ?? "?"} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{who?.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {t.subject} · {t.messages[t.messages.length - 1]?.text}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-muted-foreground">
                  {t.unread ? <Badge tone="accent">{t.unread}</Badge> : null}
                  {t.when}
                </span>
              </Link>
            </li>
          );
        })}
      </Rows>
      <IntegrationGap>
        Threads are demo content. Real delivery arrives with messaging and provider integrations.
      </IntegrationGap>
    </>
  );
}
