import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { Avatar, ContextIconTile, Panel, Rows, StatusPill, Tabs } from "@/components/kurukoo/ui";
import { entities, threads } from "@/lib/kurukoo-demo";
import { fetchFollowedTopics, topicApiConfigured, type FollowedTopic } from "@/lib/topic-lifecycle";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Kurukoo" },
      {
        name: "description",
        content: "Replies, approvals, follows and system updates in one place.",
      },
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
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [topicFollowingError, setTopicFollowingError] = useState("");
  useEffect(() => {
    if (tab !== "Following") return;
    if (!topicApiConfigured()) {
      setFollowedTopics([]);
      setTopicFollowingError("Topic updates require the canonical service connection.");
      return;
    }
    void fetchFollowedTopics()
      .then((items) => {
        setFollowedTopics(items);
        setTopicFollowingError("");
      })
      .catch((error) => {
        setFollowedTopics([]);
        setTopicFollowingError(
          error instanceof Error ? error.message : "Unable to load Topic updates.",
        );
      });
  }, [tab]);
  const pending = notifications.filter((n) => n.needsConfirmation);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Activity"
        subtitle="The things that need your attention, plus what changed while you were away."
      />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3.5">
            <ContextIconTile className="size-11 rounded-2xl bg-elevated/80">
              <Bell className="size-[18px]" />
            </ContextIconTile>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">Your attention</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
                {pending.length
                  ? `${pending.length} thing${pending.length === 1 ? "" : "s"} waiting for you`
                  : "Nothing is waiting for you"}
              </h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {unread
                  ? `${unread} unread update${unread === 1 ? "" : "s"}.`
                  : "You are up to date."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <StatusPill tone={pending.length ? "peach" : "green"}>
              {pending.length ? "Needs you" : "All clear"}
            </StatusPill>
            <span>{threads.length} conversations</span>
          </div>
        </div>
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </Panel>

      <section>
        {tab === "Needs you" ? (
          pending.length === 0 ? (
            <EmptyState
              title="Nothing waiting on you"
              body="Approvals appear here before Kurukoo commits to anything on your behalf."
            />
          ) : (
            <Rows>
              {pending.map((n) => (
                <li key={n.id} className="px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-3">
                    <ContextIconTile>
                      <CheckCircle2 className="size-[17px]" />
                    </ContextIconTile>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-medium">{n.title}</p>
                        <StatusPill tone="peach">Needs approval</StatusPill>
                      </div>
                      <p className="mt-1 text-[13.5px] leading-5 text-muted-foreground">{n.body}</p>
                      <div className="mt-3 flex gap-2">
                        <Action variant="primary" onClick={() => confirm(n.id)}>
                          Approve
                        </Action>
                        <Action onClick={() => markRead(n.id)}>Dismiss</Action>
                      </div>
                    </div>
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
                <li key={t.id}>
                  <Link
                    to="/messages/$threadId"
                    params={{ threadId: t.id }}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated sm:px-5"
                  >
                    <Avatar name={who?.name ?? "?"} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-[15px] font-medium">
                          {who?.name ?? "Conversation"}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                        {t.messages[t.messages.length - 1]?.text}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{t.when}</span>
                  </Link>
                </li>
              );
            })}
          </Rows>
        ) : null}

        {tab === "Following" ? (
          topicFollowingError ? (
            <EmptyState title="Topic updates unavailable" body={topicFollowingError} />
          ) : followedTopics.length ? (
            <Rows>
              {followedTopics.map((item) => (
                <li key={item.topic.id}>
                  <Link
                    to="/topics/$slug"
                    params={{ slug: item.topic.slug }}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated sm:px-5"
                  >
                    <ContextIconTile>
                      <MessageCircle className="size-[17px]" />
                    </ContextIconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">
                        {item.topic.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                        {item.topic.replyCount} moderated{" "}
                        {item.topic.replyCount === 1 ? "reply" : "replies"} · Updates{" "}
                        {item.relationship.notificationPreference === "muted" ? "off" : "on"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </Rows>
          ) : (
            <EmptyState
              title="No Topic follows yet"
              body="Follow a Topic to keep its updates attached to your Activity surface."
            />
          )
        ) : null}

        {tab === "System" ? (
          <EmptyState
            title="No system events"
            body="Account, security and billing events will be listed here."
          />
        ) : null}
      </section>

      <p className="text-[11px] text-muted-foreground">
        Topic Following is backed by the canonical relationship service. Other Activity categories
        still depend on their connected event sources.
      </p>
    </div>
  );
}
