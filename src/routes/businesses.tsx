import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { PulseControl } from "@/components/kurukoo/pulse-control";
import { entities } from "@/lib/kurukoo-demo";
import { fetchDiscoveryEntities, isKurukooApiConfigured, type DiscoveryEntity } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/businesses")({
  head: () => ({ meta: [
    { title: "Businesses — Kurukoo" },
    { name: "description", content: "Discover businesses, or run yours on Kurukoo with requests, customers, advertising and analytics." },
  ]}),
  component: BusinessesPage,
});
const tabs = ["Discover", "Your business"] as const;
function BusinessesPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [liveBusinesses, setLiveBusinesses] = useState<DiscoveryEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const { send } = useKurukoo();
  const demoBusinesses = entities.filter((e) => e.kind === "business");
  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    setLoading(true);
    void fetchDiscoveryEntities({ layers: ["stationary", "deals", "events"], radius: 5000 })
      .then((items) => setLiveBusinesses(items.filter((item) => /business|shop|restaurant|place|venue/i.test(item.kind))) )
      .catch(() => setLiveBusinesses([]))
      .finally(() => setLoading(false));
  }, []);
  const hasLive = liveBusinesses.length > 0;
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
  return <>
    <PageHeader title="Businesses" subtitle="Services, products and teams people can reach through Kurukoo." />
    <Tabs items={tabs} value={tab} onChange={setTab} />
    {tab === "Discover" ? <div className="mt-4 space-y-4">
      {isKurukooApiConfigured() ? <div className="rounded-2xl border border-border bg-elevated/45 px-4 py-3"><p className="text-[12px] font-semibold">Network discovery</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Business results below use the canonical Nearby discovery boundary when connected. Preview examples remain visible when the network has no returned businesses.</p></div> : null}
      {loading ? <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface" /> : hasLive ? liveBusinesses.map((b) => <article key={b.id} className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[15px] font-semibold">{b.name}</p><p className="mt-1 text-[12px] text-muted-foreground">{b.category || b.kind}{b.location ? ` · ${b.location}` : ""}</p></div><span className="rounded-full bg-elevated px-2.5 py-1 text-[10px]">{b.liveNow ? "Live now" : b.available ? "Available" : "Not confirmed"}</span></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{b.description || "Business context returned by Kurukoo."}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => send(`I found ${b.name} through Kurukoo Businesses. Help me decide whether to use this business and, if appropriate, move me into a verified request. Do not invent availability, price or capability.`)} className="inline-flex min-h-8 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground">Ask Kurukoo</button><Link to="/discover" className={actionClass()}>Open Nearby</Link></div><p className="mt-2 text-[10px] text-muted-foreground">Evidence: {b.evidence || "source attributed"} · Freshness: {b.freshness || "not stated"}</p></article>) : <>{demoBusinesses.map((b) => <EntityCard key={b.id} entity={b} />)}<p className="text-[10.5px] text-muted-foreground">{isKurukooApiConfigured() ? "Preview data remains visible here while connected network discovery has no matching businesses." : "Preview data — business examples show how the network is intended to look before a live connection is available."}</p></>}
    </div> : <div className="mt-4 space-y-6">
      <PulseControl onChanged={() => setConnected(true)} />
      <section className="rounded-2xl border border-border bg-elevated/50 p-4"><p className="text-[15px] font-semibold">Your business on Kurukoo</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Run the same operating system you use as a customer: go Live, receive requests, manage what you offer and understand demand. Go Live is a temporary availability signal, not a role switch.</p><div className="mt-3 flex flex-wrap gap-2"><Action variant="primary">Set up business</Action><Link to="/pricing" className={actionClass()}>See business plan</Link><Link to="/advertising" className={actionClass()}>Promotion</Link></div></section>
      <div className="grid gap-3 sm:grid-cols-3"><StatTile label="Availability" value={connected ? "Live" : "Off"} note={connected ? "Nearby can discover you" : "Go Live when ready"} /><StatTile label="Incoming requests" value="0" note="Live when connected" /><StatTile label="Customers" value="0" note="Relationship history" /></div>
      <section><SectionHeader title="Business tools" subtitle="The operating surface for requests, customers, offers and growth." /><Rows>{businessTools.map(([title, note, to]) => <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5"><span className="min-w-0"><span className="block text-[15px]">{title}</span><span className="block text-[13px] text-muted-foreground">{note}</span></span><Link to={to as never} className="shrink-0 text-[12px] font-medium underline">Open</Link></li>)}</Rows><div className="mt-3 flex flex-wrap gap-2"><Link to="/advertising" className={actionClass("primary")}>Offers & promotion</Link><Link to="/subscriptions" className={actionClass()}>Subscription</Link><Link to="/wallet" className={actionClass()}>Wallet</Link></div></section>
    </div>}
  </>;
}
