import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { ContextIconTile, Panel, Rows, StatusPill, Tabs } from "@/components/kurukoo/ui";
import { fetchChatHistory } from "@/lib/kurukoo-api";
import { fetchFollowedTopics, topicApiConfigured, type FollowedTopic } from "@/lib/topic-lifecycle";
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
type ActivityConversation = { id: string; title?: string | null; channel?: string; updated_at?: string };
type ActivityMessage = {
  id: number;
  sender: string;
  content: string;
  conversation_id?: string | null;
  conversationId?: string | null;
  created_at?: string;
  createdAt?: string;
};

function ActivityPage() {
  const { notifications, confirm, markRead } = useKurukoo();
  const [tab, setTab] = useState<string>(tabs[0]);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [topicFollowingError, setTopicFollowingError] = useState("");
  const [conversations, setConversations] = useState<ActivityConversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<ActivityMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
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
        setTopicFollowingError(error instanceof Error ? error.message : "Unable to load Topic updates.");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError("");
    void fetchChatHistory(undefined, 100)
      .then((data) => {
        if (cancelled) return;
        setConversations((data.conversations ?? []) as ActivityConversation[]);
        setConversationMessages((data.messages ?? []) as ActivityMessage[]);
      })
      .catch((error) => {
        if (cancelled) return;
        setConversations([]);
        setConversationMessages([]);
        setHistoryError(error instanceof Error ? error.message : "Unable to load your conversation activity.");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const replyItems = useMemo(() => {
    const latestByConversation = new Map<string, ActivityMessage>();
    for (const message of conversationMessages) {
      const conversationId = message.conversationId ?? message.conversation_id;
      if (!conversationId || !message.content?.trim()) continue;
      const current = latestByConversation.get(conversationId);
      const currentTime = current?.createdAt ?? current?.created_at ?? "";
      const messageTime = message.createdAt ?? message.created_at ?? "";
      if (!current || messageTime >= currentTime) latestByConversation.set(conversationId, message);
    }
    return conversations
      .map((conversation) => ({ conversation, latest: latestByConversation.get(conversation.id) }))
      .filter(({ latest }) => Boolean(latest))
      .sort((a, b) => new Date(b.conversation.updated_at ?? "").getTime() - new Date(a.conversation.updated_at ?? "").getTime());
  }, [conversations, conversationMessages]);

  const pending = notifications.filter((n) => n.needsConfirmation);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-7">
      <PageHeader title="Activity" subtitle="The things that need your attention, plus what changed while you were away." />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3.5">
            <ContextIconTile className="size-11 rounded-2xl bg-elevated/80"><Bell className="size-[18px]" /></ContextIconTile>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">Your attention</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
                {pending.length ? `${pending.length} thing${pending.length === 1 ? "" : "s"} waiting for you` : "Nothing is waiting for you"}
              </h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {unread ? `${unread} unread update${unread === 1 ? "" : "s"}.` : "You are up to date."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <StatusPill tone={pending.length ? "peach" : "green"}>{pending.length ? "Needs you" : "All clear"}</StatusPill>
            <span>{historyLoading ? "Checking conversations" : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}</span>
          </div>
        </div>
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </Panel>

      <section>
        {tab === "Needs you" ? (
          pending.length === 0 ? (
            <EmptyState title="Nothing waiting on you" body="Approvals appear here before Kurukoo commits to anything on your behalf." />
          ) : (
            <Rows>
              {pending.map((n) => (
                <li key={n.id} className="px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-3">
                    <ContextIconTile><CheckCircle2 className="size-[17px]" /></ContextIconTile>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="text-[15px] font-medium">{n.title}</p><StatusPill tone="peach">Needs approval</StatusPill></div>
                      <p className="mt-1 text-[13.5px] leading-5 text-muted-foreground">{n.body}</p>
                      <div className="mt-3 flex gap-2"><Action variant="primary" onClick={() => confirm(n.id)}>Approve</Action><Action onClick={() => markRead(n.id)}>Dismiss</Action></div>
                    </div>
                  </div>
                </li>
              ))}
            </Rows>
          )
        ) : null}

        {tab === "Replies" ? (
          historyLoading ? (
            <Panel className="p-5"><div className="h-4 w-36 animate-pulse rounded bg-elevated" /><div className="mt-3 h-3 w-64 animate-pulse rounded bg-elevated" /></Panel>
          ) : historyError ? (
            <EmptyState title="Conversation activity unavailable" body={historyError} />
          ) : replyItems.length ? (
            <Rows>
              {replyItems.map(({ conversation, latest }) => {
                const updated = conversation.updated_at ? new Date(conversation.updated_at).toLocaleString() : "";
                return (
                  <li key={conversation.id}>
                    <Link
                      to="/chat"
                      onClick={() => localStorage.setItem("kurukoo-open-conversation", conversation.id)}
                      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated sm:px-5"
                    >
                      <ContextIconTile><MessageCircle className="size-[17px]" /></ContextIconTile>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{conversation.title || "Kurukoo conversation"}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{latest?.content}</span>
                      </span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{updated}</span>
                    </Link>
                  </li>
                );
              })}
            </Rows>
          ) : (
            <EmptyState title="No conversation updates yet" body="Your saved Kurukoo conversations will appear here as they develop." />
          )
        ) : null}

        {tab === "Following" ? (
          topicFollowingError ? <EmptyState title="Topic updates unavailable" body={topicFollowingError} /> : followedTopics.length ? (
            <Rows>
              {followedTopics.map((item) => (
                <li key={item.topic.id}>
                  <Link to="/topics/$slug" params={{ slug: item.topic.slug }} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated sm:px-5">
                    <ContextIconTile><MessageCircle className="size-[17px]" /></ContextIconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{item.topic.title}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{item.topic.replyCount} moderated {item.topic.replyCount === 1 ? "reply" : "replies"} · Updates {item.relationship.notificationPreference === "muted" ? "off" : "on"}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </Rows>
          ) : <EmptyState title="No Topic follows yet" body="Follow a Topic to keep its updates attached to your Activity surface." />
        ) : null}

        {tab === "System" ? <EmptyState title="No system events" body="Account, security and billing events will be listed here." /> : null}
      </section>

      <p className="text-[11px] text-muted-foreground">Conversation activity and Topic Following are backed by canonical services. Approval and system events still depend on their connected event sources.</p>
    </div>
  );
}
