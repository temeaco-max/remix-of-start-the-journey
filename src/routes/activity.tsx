import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Rows, Tabs } from "@/components/kurukoo/ui";
import { entities, threads, topics } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Kurukoo" },
      { name: "description", content: "Replies, approvals, follows and system updates in one place." },
      { property: "og:title", content: "Activity — Kurukoo" },
      { property: "og:description", content: "Everything that happened around your requests." },
    ],
  }),
  component: ActivityPage,
});

const tabs = ["Needs you", "Replies", "Following", "System"] as const;

function ActivityPage() {
  const { notifications, confirm, markRead } = useKurukoo();
  const [tab, setTab] = useState<string>(tabs[0]);

  const pending = notifications.filter((n) => n.needsConfirmation);

  return (
    <>
      <PageHeader title="Activity" subtitle="Replies, approvals and updates from your network." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      <div className="mt-4 space-y-3">
        {tab === "Needs you" ? (
          pending.length === 0 ? (
            <EmptyState
              title="Nothing waiting on you"
              body="Approvals appear here before Kurukoo commits to anything on your behalf."
            />
          ) : (
            <Rows>
              {pending.map((n) => (
                <li key={n.id} className="px-4 py-4">
                  <p className="text-[15px] font-medium">{n.title}</p>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{n.body}</p>
                  <div className="mt-3 flex gap-2">
                    <Action variant="primary" onClick={() => confirm(n.id)}>
                      Approve
                    </Action>
                    <Action onClick={() => markRead(n.id)}>Dismiss</Action>
                  </div>
                </li>
              ))}
            </Rows>
          )
        ) : null}

        {tab === "Replies" ? (
          <Rows>
            {threads.map((t) => {
              const who = entities.find((e) => e.id === t.withId);
              return (
                <li key={t.id} className="px-4 py-3.5">
                  <Link to="/messages/$threadId" params={{ threadId: t.id }} className="flex items-center gap-3">
                    <Avatar name={who?.name ?? "?"} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{who?.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {t.messages[t.messages.length - 1]?.text}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12.5px] text-muted-foreground">{t.when}</span>
                  </Link>
                </li>
              );
            })}
          </Rows>
        ) : null}

        {tab === "Following" ? (
          <Rows>
            {topics.map((t) => (
              <li key={t.slug} className="px-4 py-3.5">
                <Link to="/topics/$slug" params={{ slug: t.slug }} className="block">
                  <span className="text-[15px]">New discussion in {t.name}</span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {t.posts[0]?.author}: {t.posts[0]?.text}
                  </span>
                </Link>
              </li>
            ))}
          </Rows>
        ) : null}

        {tab === "System" ? (
          <EmptyState
            title="No system events"
            body="Account, security and billing events will be listed here."
          />
        ) : null}
      </div>

      <IntegrationGap>
        Activity is demo content plus your current session. Push, email and provider webhooks are
        not connected yet.
      </IntegrationGap>
    </>
  );
}
