import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bot, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { actionClass } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader, Tabs } from "@/components/kurukoo/ui";
import { PulseControl } from "@/components/kurukoo/pulse-control";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { fetchDiscoveryEntities, isKurukooApiConfigured, type DiscoveryEntity } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [
    { title: "Businesses — Kurukoo" },
    { name: "description", content: "Discover businesses, or run yours on Kurukoo with requests, customers, agents and promotion." },
  ] }),
  component: BusinessesPage,
});

const tabs = ["Discover", "Your business"] as const;

function BusinessesPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [liveBusinesses, setLiveBusinesses] = useState<DiscoveryEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const { send } = useKurukoo();
  const businessTools = useMemo(() => [
    ["Profile and location", "How people find you", "/businesses"],
    ["Products and services", "What you offer", "/capabilities"],
    ["Team", "Who can respond", "/network"],
    ["Orders and requests", "Jobs in progress", "/work"],
    ["Customers and messages", "Relationship context", "/messages"],
    ["Demand and insights", "What people are asking for", "/activity"],
    ["Offers and promotion", "Commercial discovery", "/advertising"],
    ["Subscription and payments", "Plan and billing", "/subscriptions"],
    ["Verification", "Trust and safety", "/settings"],
  ], []);
  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    setLoading(true);
    void fetchDiscoveryEntities({ layers: ["stationary", "deals", "events"], radius: 5000 })
      .then((items) => setLiveBusinesses(items.filter((item) => /business|shop|restaurant|place|venue/i.test(item.kind))))
      .catch(() => setLiveBusinesses([]))
      .finally(() => setLoading(false));
  }, []);
  return <>
    <PageHeader title="Businesses" subtitle="Services, products and teams people can reach through Kurukoo." />
    <Tabs items={tabs} value={tab} onChange={setTab} />
    {tab === "Discover" ? <div className="mt-4 space-y-4">
      <section className="rounded-2xl border border-border bg-foreground p-5 text-background">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background/10"><Store className="size-5" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-background/55">Businesses</p><h2 className="mt-1 text-[22px] font-semibold tracking-tight">Find a business for what you need.</h2><p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-background/70">Kurukoo can help you assess a business and, where the underlying service supports it, move from discovery into a verified request or conversation.</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2"><AskKurukoo prompt="Help me find a business that can provide what I need." className="bg-background text-foreground hover:bg-background/90" /><Link to="/discover" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-background/20 px-3 text-[11.5px] font-medium hover:bg-background/10">Open Nearby <ArrowUpRight className="size-3.5" /></Link></div>
      </section>
      {loading ? <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface" /> : liveBusinesses.length ? liveBusinesses.map((b) => <article key={b.id} className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[15px] font-semibold">{b.name}</p><p className="mt-1 text-[12px] text-muted-foreground">{b.category || b.kind}{b.location ? ` · ${b.location}` : ""}</p></div><span className="rounded-full bg-elevated px-2.5 py-1 text-[10px]">{b.liveNow ? "Live now" : b.available === true ? "Available" : "Not confirmed"}</span></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{b.description || "Business context returned by Kurukoo."}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => send(`I found ${b.name} through Kurukoo Businesses. Help me decide whether to use this business and, if appropriate, move me into a verified request. Do not invent availability, price or capability.`)} className="inline-flex min-h-8 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground">Ask Kurukoo</button><Link to="/discover" className={actionClass()}>Open Nearby</Link></div><p className="mt-2 text-[10px] text-muted-foreground">Evidence: {b.evidence || "source attributed"} · Freshness: {b.freshness || "not stated"}</p></article>) : <section className="rounded-2xl border border-dashed border-border px-5 py-10 text-center"><p className="text-[13px] font-medium">No connected business results right now.</p><p className="mt-1.5 text-[11px] text-muted-foreground">Kurukoo will not fill the directory with invented businesses.</p><div className="mt-4"><AskKurukoo prompt="Find a real business that can help me with what I need." /></div></section>}
    </div> : <div className="mt-4 space-y-6">
      <PulseControl onChanged={() => setConnected(true)} />
      <section className="rounded-2xl border border-border bg-elevated/50 p-4"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Bot className="size-4" /></span><div><p className="text-[15px] font-semibold">Your business storefront</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Tell Kurukoo what your business offers, where you operate and how customers should reach you. Kurukoo can then help you organise the next setup step.</p></div></div><div className="mt-3 flex flex-wrap gap-2"><AskKurukoo prompt="Help me set up my business storefront on Kurukoo." className="min-h-9 bg-primary text-primary-foreground hover:bg-primary/90">Set up storefront</AskKurukoo><Link to="/pricing" className={actionClass()}>See business plan</Link><Link to="/advertising" className={actionClass()}>Promotion</Link></div></section>
      <section><SectionHeader title="Business tools" subtitle="Open the part of your business account you want to work on." /><Rows>{businessTools.map(([title, note, to]) => <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5"><span className="min-w-0"><span className="block text-[13.5px] font-medium">{title}</span><span className="block text-[11px] text-muted-foreground">{note}</span></span><Link to={to as never} className="shrink-0 text-[11.5px] font-medium underline">Open</Link></li>)}</Rows></section>
      {connected ? <p className="text-[10.5px] text-muted-foreground">Nearby Pulse is active for this business surface.</p> : null}
    </div>}
  </>;
}
