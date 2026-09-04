import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Compass, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard, TopicCard, VideoCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { AdSlot, Chips, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import { entities, entityById, topics, videos } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";
import { DailyPicksGrid } from "@/routes/daily-picks";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [
    { title: "Explore — Kurukoo" },
    { name: "description", content: "Discover people, businesses, services, creators, topics and content." },
    { property: "og:title", content: "Explore — Kurukoo" },
    { property: "og:description", content: "Discover useful people, places, ideas and services." },
  ] }),
  component: ExplorePage,
});
const categories = ["All", "Network", "Businesses", "Creators", "Topics", "Watch"] as const;
const starters = ["Find me a plumber.", "Book me a dentist.", "I need someone to repair my phone.", "Get my boiler serviced."];

function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(categories[0]);
  const { send } = useKurukoo();
  const navigate = useNavigate();
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entities.filter((e) => {
      const kindOk = cat === "All" || (cat === "Network" && e.kind === "provider") || (cat === "Businesses" && e.kind === "business") || (cat === "Creators" && e.kind === "creator");
      return kindOk && (!term || (e.name + e.tagline + e.topics.join(" ")).toLowerCase().includes(term));
    });
  }, [q, cat]);
  const showEntities = cat === "All" || cat === "Network" || cat === "Businesses" || cat === "Creators";

  return <div className="space-y-8">
    <PageHeader title="Explore" subtitle="Find people, places and ideas — then hand the useful part to Kurukoo." />
    <section className="relative overflow-hidden rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-[#f4e6dc]/60 blur-3xl" />
      <div className="relative flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4e6dc] text-[#765443]"><Compass className="size-[18px]" /></span><div><p className="text-[12px] font-medium text-muted-foreground">Discovery</p><h2 className="mt-1 text-[20px] font-semibold tracking-tight">What are you looking for?</h2><p className="mt-1 text-[13px] text-muted-foreground">Search first, or tell Kurukoo what you want and let it coordinate the next step.</p></div></div>
      <div className="relative mt-5"><SearchField label="Search Kurukoo" placeholder="Search people, places, topics…" value={q} onChange={setQ} /></div>
      <div className="relative mt-3"><Chips items={categories} value={cat} onChange={setCat} label="Discovery categories" /></div>
    </section>
    <section><SectionHeader title="Daily Picks" subtitle="A quick starting point for today." action={<Link to="/daily-picks" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">See all <ArrowUpRight className="size-3.5" /></Link>} /><DailyPicksGrid /></section>
    <section><SectionHeader title="Start a request" subtitle="Hand a useful task straight to Kurukoo." /><div className="flex flex-wrap gap-2">{starters.map((s) => <button key={s} type="button" onClick={() => { send(s); navigate({ to: "/" }); }} className="min-h-9 rounded-full border border-border bg-surface px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground">{s}</button>)}</div></section>
    {showEntities ? <section><SectionHeader title={cat === "All" ? "People and places" : cat} subtitle={`${results.length} results`} /><div className="grid gap-3">{results.map((e) => <EntityCard key={e.id} entity={e} />)}</div><div className="mt-3"><AdSlot placement="Explore feed" headline="Sponsored result" body="Sponsored results are clearly separated from organic discovery." advertiser="Example advertiser" /></div></section> : null}
    {cat === "All" || cat === "Topics" ? <section><SectionHeader title="Topics" action={<Link to="/topics" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">All topics <ArrowUpRight className="size-3.5" /></Link>} /><div className="grid gap-3 sm:grid-cols-2">{topics.map((t) => <TopicCard key={t.slug} topic={t} />)}</div></section> : null}
    {cat === "All" || cat === "Watch" || cat === "Creators" ? <section><SectionHeader title="Watch" action={<Link to="/creators" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">Creators <ArrowUpRight className="size-3.5" /></Link>} /><div className="grid gap-4 sm:grid-cols-2">{videos.map((v) => <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />)}</div></section> : null}
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Sparkles className="size-3.5" />Discovery is ready to explore; some results become live as connections are added.</div>
    <IntegrationGap>Availability is only shown as confirmed when Kurukoo can verify it.</IntegrationGap>
  </div>;
}
