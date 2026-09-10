import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, PlaySquare, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard, VideoCard } from "@/components/kurukoo/cards";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { entities, entityById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/creators")({ head: () => ({ meta: [{ title: "Creators — Kurukoo" }, { name: "description", content: "Watch useful content, discover creators, or build a channel with publishing, subscribers and revenue tools." }] }), component: CreatorsPage });
const tabs = ["Watch", "Creators", "Creator studio"] as const;

function CreatorsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const creators = entities.filter((e) => e.kind === "creator");
  return <><PageHeader title="Creators" subtitle="Useful content, creator channels and the tools to publish." /><Tabs items={tabs} value={tab} onChange={setTab} />
    {tab === "Watch" ? <div className="mt-4 space-y-5"><section className="grid gap-4 sm:grid-cols-2">{videos.map((v) => <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />)}</section><div className="flex flex-wrap gap-2"><Link to="/topics" className={actionClass()}>Explore Topics <ArrowUpRight className="ml-1 size-3.5" /></Link><AskKurukoo prompt="Find useful creator content for something I am trying to get done." /></div></div> : null}
    {tab === "Creators" ? <div className="mt-4 grid gap-3">{creators.map((c) => <EntityCard key={c.id} entity={c} />)}</div> : null}
    {tab === "Creator studio" ? <div className="mt-4 space-y-6"><section className="rounded-2xl border border-border bg-elevated/50 p-5"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-brand-ink"><PlaySquare className="size-4.5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Creator studio</p><h2 className="mt-1.5 font-serif text-[28px] leading-tight">Make something useful and put it where people can find it.</h2><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Start a video, organise your channel, connect it to Topics and use Kurukoo's existing discovery surfaces.</p></div></div><div className="mt-4 flex flex-wrap gap-2"><AskKurukoo prompt="Help me create and publish a useful creator video on Kurukoo." /><Link to="/topics" className={actionClass()}>Choose Topics</Link><Link to="/wallet" className={actionClass()}>Open Wallet</Link></div></section><div className="grid gap-3 sm:grid-cols-3"><StatTile label="Subscribers" value="12.8K" note="Example channel data" /><StatTile label="Views (30 days)" value="58.4K" note="Example channel data" /><StatTile label="Earnings" value="£246.80" note="Example channel data" /></div><section><SectionHeader title="Your studio" subtitle="The working areas behind a creator channel."/><Rows>{[["New video", "Create a new useful video", "/chat"], ["Content library", "Everything you've published", "/videos"], ["Topics and placement", "Where your content appears", "/topics"], ["Comments and discussion", "Viewer conversations", "/activity"], ["Channel settings", "Name, description and links", "/settings"], ["Subscribers", "Audience and membership", "/network"], ["Earnings", "Revenue share and payouts", "/wallet"]].map(([title,note,to]) => <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5"><span><span className="block text-[13.5px]">{title}</span><span className="block text-[11px] text-muted-foreground">{note}</span></span><Link to={to as never} className="text-[11.5px] font-medium underline">Open</Link></li>)}</Rows></section><div className="rounded-xl border border-dashed border-border px-4 py-3 text-[10.5px] text-muted-foreground"><Sparkles className="mr-1 inline size-3"/>Example studio figures are illustrative; publishing and revenue settlement remain tied to connected services.</div></div> : null}
  </>;
}
