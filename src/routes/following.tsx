import { createFileRoute, Link } from "@tanstack/react-router";
import { BellOff, BellRing, Eye, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ContactRow } from "@/components/kurukoo/cards";
import { FollowButton, Rows, Tabs } from "@/components/kurukoo/ui";
import { entities } from "@/lib/kurukoo-demo";
import { fetchFollowedTopics, topicApiConfigured, type FollowedTopic } from "@/lib/topic-lifecycle";
import { setTopicNotificationPreference, unfollowCanonicalTopic } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/following")({
  head: () => ({ meta: [{ title: "Following — Kurukoo" }, { name: "description", content: "The people, providers, businesses, creators and Topics you follow." }] }),
  component: FollowingPage,
});

const tabs = ["People", "Providers", "Businesses", "Creators", "Topics"] as const;

function TopicFollowingRow({ item, onChanged }: { item: FollowedTopic; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const muted = item.relationship.notificationPreference === "muted";
  async function toggleMute() {
    setBusy(true);
    try { await setTopicNotificationPreference(item.topic.id, muted ? "all" : "muted"); onChanged(); }
    catch { setBusy(false); return; }
    setBusy(false);
  }
  async function unfollow() {
    if (!window.confirm("Stop following this Topic? You will no longer receive its updates.")) return;
    setBusy(true);
    try { await unfollowCanonicalTopic(item.topic.id); onChanged(); } finally { setBusy(false); }
  }
  return <article className="rounded-[18px] border border-border bg-surface p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated"><MessageCircle className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground"><span className="rounded-full bg-elevated px-2 py-1">{item.topic.type.replace(/[_-]/g, " ")}</span>{item.topic.category ? <span className="rounded-full bg-elevated px-2 py-1">{item.topic.category.replace(/[_-]/g, " ")}</span> : null}</div><p className="mt-2 text-[14px] font-medium">{item.topic.title}</p><p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{item.topic.body}</p><p className="mt-2 text-[10.5px] text-muted-foreground">Updates: {muted ? "Off" : "On"}</p></div></div><div className="mt-3 flex flex-wrap items-center gap-2"><Link to="/topics/$slug" params={{ slug: item.topic.slug }} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11.5px] hover:bg-elevated"><Eye className="size-3.5" />View Topic</Link><button type="button" onClick={() => void toggleMute()} disabled={busy} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11.5px] text-muted-foreground hover:bg-elevated disabled:opacity-50">{muted ? <BellRing className="size-3.5" /> : <BellOff className="size-3.5" />}{muted ? "Unmute updates" : "Mute updates"}</button><button type="button" onClick={() => void unfollow()} disabled={busy} className="ml-auto inline-flex min-h-8 rounded-lg px-2.5 text-[11.5px] text-muted-foreground hover:bg-elevated disabled:opacity-50">Unfollow</button></div></article>;
}

function FollowingPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicError, setTopicError] = useState("");
  const kind = tab === "People" ? "person" : tab === "Providers" ? "provider" : tab === "Businesses" ? "business" : "creator";
  const list = entities.filter((e) => e.kind === kind);

  async function loadTopics() {
    setLoadingTopics(true); setTopicError("");
    if (!topicApiConfigured()) { setFollowedTopics([]); setTopicError("Topic relationships are connected to the canonical service, but this environment is not configured for it."); setLoadingTopics(false); return; }
    try { setFollowedTopics(await fetchFollowedTopics()); } catch (error) { setTopicError(error instanceof Error ? error.message : "Unable to load followed Topics."); }
    finally { setLoadingTopics(false); }
  }
  useEffect(() => { if (tab === "Topics") void loadTopics(); }, [tab]);

  return <><PageHeader title="Following" subtitle="The network behind your requests." /><Tabs items={tabs} value={tab} onChange={(value) => setTab(value as (typeof tabs)[number])} /><div className="mt-4">{tab === "Topics" ? loadingTopics ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /></div> : topicError ? <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-[13px] text-muted-foreground">{topicError}</p> : followedTopics.length ? <div className="grid gap-3 sm:grid-cols-2">{followedTopics.map((item) => <TopicFollowingRow key={item.topic.id} item={item} onChanged={() => void loadTopics()} />)}</div> : <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center"><p className="text-[14px]">No Topics followed yet.</p><Link to="/topics" className="mt-2 inline-flex text-[12.5px] font-medium underline">Explore Topics</Link></div> : list.length === 0 ? <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-[14px] text-muted-foreground">Nothing followed here yet.</p> : <Rows>{list.map((e) => <ContactRow key={e.id} entity={e} right={<FollowButton small />} />)}</Rows>}</div><p className="mt-5 text-[11px] text-muted-foreground">Topic follows, mute preferences and removals are persisted by Kurukoo's canonical relationship service.</p></>;
}
