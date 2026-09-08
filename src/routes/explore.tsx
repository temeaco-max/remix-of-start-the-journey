import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Car,
  Home,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard, VideoCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Chips, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import {
  fetchAuthenticatedAd,
  fetchCanonicalTopics,
  fetchDiscoveryEntities,
  type AuthenticatedAd,
  type CanonicalTopic,
  type DiscoveryEntity,
} from "@/lib/kurukoo-api";
import { entities, entityById, videos } from "@/lib/kurukoo-demo";
import { exploreGoalGroups } from "@/lib/explore-goals";
import { useKurukoo } from "@/lib/kurukoo-store";
import { DailyPicksGrid } from "@/routes/daily-picks";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Kurukoo" },
      { name: "description", content: "Discover useful people, places, ideas, services and opportunities." },
      { property: "og:title", content: "Explore — Kurukoo" },
      { property: "og:description", content: "Discover useful people, places, ideas, services and opportunities." },
    ],
  }),
  component: ExplorePage,
});

const categories = ["All", "Network", "Businesses", "Creators", "Topics", "Watch", "Opportunities"] as const;

const goalRoutes: Record<string, string> = {
  "money-circle": "/explore/money-circle",
  food: "/explore/food",
  groceries: "/explore/groceries",
  ride: "/explore/mobility",
  repair: "/explore/repairs",
  cleaning: "/explore/home",
  solar: "/explore/home",
  work: "/explore/work",
  sell: "/explore/selling",
  health: "/explore/health",
  education: "/explore/learning",
  events: "/explore/events",
  spiritual: "/explore/prayer",
  connect: "/explore/community",
  emergency: "/explore/safety",
  security: "/explore/safety",
};

const starters = ["Find me a plumber.", "Book me a dentist.", "I need someone to repair my phone.", "Get my boiler serviced."];

function pretty(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function evidenceLabel(value?: string | null) {
  if (!value) return "Source attributed";
  const normalized = value.toLowerCase();
  if (normalized.includes("verif")) return "Verified";
  if (normalized.includes("claim")) return "Claimed";
  if (normalized.includes("community")) return "Community";
  if (normalized.includes("system")) return "System sourced";
  return pretty(value);
}

function availabilityLabel(entity: DiscoveryEntity) {
  if (entity.liveNow) return "Live now";
  if (entity.available === true) return "Available";
  if (entity.available === false) return "Not confirmed available";
  return "Availability unconfirmed";
}

function DiscoveryEntityCard({ entity }: { entity: DiscoveryEntity }) {
  const evidence = evidenceLabel(entity.evidence);
  const available = entity.available === true || entity.liveNow === true;
  return (
    <article className="rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="truncate text-[14.5px] font-semibold">{entity.name}</h3><span className="rounded-full bg-elevated px-2 py-0.5 text-[9.5px] font-medium">{evidence}</span></div><p className="mt-1 text-[11.5px] text-muted-foreground">{pretty(entity.category ?? entity.kind)}{entity.location ? ` · ${entity.location}` : ""}</p></div>
        <span className={available ? "shrink-0 rounded-full bg-brand-tint px-2 py-1 text-[9.5px] font-medium text-brand-ink" : "shrink-0 rounded-full bg-elevated px-2 py-1 text-[9.5px] font-medium text-muted-foreground"}>{availabilityLabel(entity)}</span>
      </div>
      {entity.description ? <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{entity.description}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">{entity.freshness ? <span>{entity.freshness}</span> : null}{entity.lifecycle ? <span>· {pretty(entity.lifecycle)}</span> : null}{entity.source ? <span>· {entity.source}</span> : null}</div>
      <div className="mt-3 flex flex-wrap gap-2"><Link to="/chat" search={{ query: entity.chatAction?.entityId ? entity.name : `Help me with ${entity.name}` } as never} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground">Ask Kurukoo <ArrowUpRight className="size-3.5" /></Link>{entity.chatAction?.type ? <span className="inline-flex min-h-8 items-center rounded-lg border border-border px-3 text-[10.5px] text-muted-foreground">{pretty(entity.chatAction.type)}</span> : null}</div>
    </article>
  );
}

function ExploreTopicCard({ topic }: { topic: CanonicalTopic }) {
  const locality = [topic.city, topic.lga].filter(Boolean).join(" · ");
  return <Link to="/topics/$slug" params={{ slug: topic.slug }} className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"><span className="rounded-full bg-elevated px-2 py-1 font-medium text-foreground/80">{pretty(topic.type)}</span>{topic.category ? <span className="rounded-full bg-elevated px-2 py-1">{pretty(topic.category)}</span> : null}{locality ? <span className="rounded-full bg-elevated px-2 py-1">{locality}</span> : null}</div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></div><h3 className="mt-4 text-[15.5px] font-medium leading-snug">{topic.title}</h3><p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{topic.body}</p><div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{topic.replyCount} {topic.replyCount === 1 ? "moderated reply" : "moderated replies"}</span><span>·</span><span>{topic.authorLabel}</span></div></Link>;
}

function SponsoredExploreCard({ campaign }: { campaign: AuthenticatedAd }) {
  return <a href={campaign.clickUrl} rel="nofollow" className="block rounded-[18px] border border-border bg-elevated/45 p-4 transition-colors hover:bg-elevated"><div className="flex items-center justify-between gap-2"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{campaign.disclosure}</p><ArrowUpRight className="size-3 text-muted-foreground" /></div><p className="mt-2 text-[13.5px] font-semibold">{campaign.title}</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{campaign.desc}</p><span className="mt-2 inline-flex text-[10.5px] font-medium">{campaign.ctaText}</span></a>;
}

function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(categories[0]);
  const [topicData, setTopicData] = useState<CanonicalTopic[]>([]);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicRefreshing, setTopicRefreshing] = useState(false);
  const [topicError, setTopicError] = useState("");
  const [discoveryData, setDiscoveryData] = useState<DiscoveryEntity[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState("");
  const [exploreAd, setExploreAd] = useState<AuthenticatedAd | null>(null);
  const { send } = useKurukoo();
  const navigate = useNavigate();

  async function loadTopics(refresh = false) {
    if (refresh) setTopicRefreshing(true); else setTopicLoading(true);
    try { setTopicData(await fetchCanonicalTopics(6)); setTopicError(""); } catch (error) { setTopicData([]); setTopicError(error instanceof Error ? error.message : "Community context is unavailable right now."); } finally { setTopicLoading(false); setTopicRefreshing(false); }
  }
  async function loadDiscovery() {
    setDiscoveryLoading(true);
    try { setDiscoveryData(await fetchDiscoveryEntities({ radius: 5000, q: q.trim() || undefined })); setDiscoveryError(""); } catch (error) { setDiscoveryData([]); setDiscoveryError(error instanceof Error ? error.message : "Live discovery is unavailable right now."); } finally { setDiscoveryLoading(false); }
  }
  useEffect(() => { void loadTopics(); void loadDiscovery(); void fetchAuthenticatedAd("desk-content").then(setExploreAd).catch(() => setExploreAd(null)); }, []);
  useEffect(() => { const timer = window.setTimeout(() => void loadDiscovery(), 250); return () => window.clearTimeout(timer); }, [q]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entities.filter((e) => {
      const kindOk = cat === "All" || (cat === "Network" && e.kind === "provider") || (cat === "Businesses" && e.kind === "business") || (cat === "Creators" && e.kind === "creator") || (cat === "Watch" && e.kind === "creator") || (cat === "Opportunities" && e.kind === "opportunity");
      const textOk = !term || `${e.name} ${e.description} ${e.category}`.toLowerCase().includes(term);
      return kindOk && textOk;
    });
  }, [cat, q]);
  const liveResults = discoveryData;
  const filteredTopics = useMemo(() => { const term = q.trim().toLowerCase(); return topicData.filter((topic) => !term || `${topic.title} ${topic.body} ${topic.category} ${topic.city} ${topic.lga}`.toLowerCase().includes(term)); }, [q, topicData]);

  return (
    <div className="space-y-8">
      <PageHeader title="Explore" subtitle="Start with something you want to get done, then explore the people, places and community around it." />

      <section className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">What are you trying to do?</p><h2 className="mt-1 text-[21px] font-semibold tracking-tight">Choose a goal or just ask.</h2><p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">These are starting points, not separate products. Kurukoo can turn the goal into a request and coordinate the next step.</p></div><Link to="/capabilities" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-[11.5px] font-medium hover:bg-elevated">All capabilities <ArrowUpRight className="size-3.5" /></Link></div>
        <div className="mt-5"><SearchField label="Search the network or describe what you need" placeholder="Try: get a ride, find a plumber, start a savings circle…" value={q} onChange={setQ} /></div>
      </section>

      <section>
        <SectionHeader title="Get something done" subtitle="Useful starting points across everyday life." />
        <div className="space-y-5">
          {exploreGoalGroups.map((group) => { const GroupIcon = group.icon; return <div key={group.id}><div className="mb-2.5 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-elevated"><GroupIcon className="size-3.5" /></span><h3 className="text-[13px] font-semibold">{group.label}</h3></div><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.goals.map((goal) => { const GoalIcon = goal.icon; const destination = goalRoutes[goal.id]; const isTask = Boolean(destination); const action = destination ?? "/chat"; return <Link key={goal.id} to={action as never} search={!isTask ? ({ query: goal.prompt } as never) : undefined} className="group flex min-h-[108px] flex-col rounded-[17px] border border-border bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-elevated/45"><div className="flex items-start justify-between gap-2"><span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><GoalIcon className="size-3.5" /></span><ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div><p className="mt-3 text-[12.5px] font-semibold leading-snug">{goal.label}</p><span className="mt-auto pt-2 text-[9.5px] text-muted-foreground">{isTask ? "Open task" : "Start in Chat"}</span></Link>; })}</div></div>; })}
        </div>
      </section>

      <section><SectionHeader title="Find what is around you" subtitle="Discovery and community remain separate from fulfilment proof." /><div className="grid gap-3 md:grid-cols-3"><Link to="/discover" className="group rounded-[19px] border border-primary/20 bg-brand-tint/20 p-4"><MapPin className="size-5 text-primary" /><h3 className="mt-3 text-[14px] font-semibold">Nearby</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">See live providers, businesses, offers and events around you.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Nearby <ArrowUpRight className="size-3" /></span></Link><Link to="/topics" className="group rounded-[19px] border border-border bg-surface p-4"><Users className="size-5" /><h3 className="mt-3 text-[14px] font-semibold">Topics</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">See what people are discussing and use community context when it helps.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">Browse Topics <ArrowUpRight className="size-3" /></span></Link><Link to="/agents" className="group rounded-[19px] border border-border bg-elevated/35 p-4"><Sparkles className="size-5 text-primary" /><h3 className="mt-3 text-[14px] font-semibold">Agents</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Let your Kurukoo agents watch, plan and carry bounded tasks forward.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Agents <ArrowUpRight className="size-3" /></span></Link></div></section>

      <section><SectionHeader title="Start a request" subtitle="Hand a useful task straight to Kurukoo." /><div className="flex flex-wrap gap-2">{starters.map((s) => <button key={s} type="button" onClick={() => { send(s); navigate({ to: "/" }); }} className="min-h-9 rounded-full border border-border bg-surface px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground">{s}</button>)}</div></section>

      {cat !== "Topics" && cat !== "Watch" ? <section><SectionHeader title="Live discovery" subtitle="Canonical signals carry evidence, freshness and availability state." action={<button type="button" onClick={() => void loadDiscovery()} className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"><RefreshCw className="size-3.5" /> Refresh</button>} />{discoveryLoading ? <div className="grid gap-3 md:grid-cols-2"><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /></div> : liveResults.length ? <div className="grid gap-3 md:grid-cols-2">{liveResults.slice(0, 8).map((entity) => <DiscoveryEntityCard key={entity.id} entity={entity} />)}</div> : <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">{discoveryError || "No canonical discovery signals match this view yet. Kurukoo does not manufacture availability."}</div>}</section> : null}

      {cat === "All" || cat === "Topics" ? <section><SectionHeader title="Topics" subtitle="Community conversation with context — never fulfilment proof." action={<Link to="/topics" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">All Topics <ArrowUpRight className="size-3.5" /></Link>} /><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[11.5px] text-muted-foreground"><ShieldCheck className="size-3.5" /> Moderated public context</div><button type="button" onClick={() => void loadTopics(true)} disabled={topicRefreshing} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground disabled:opacity-50"><RefreshCw className={topicRefreshing ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh</button></div>{topicLoading ? <div className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[18px] border border-border bg-surface" />)}</div> : filteredTopics.length ? <div className="grid gap-3 sm:grid-cols-2">{filteredTopics.map((topic) => <ExploreTopicCard key={topic.id} topic={topic} />)}</div> : <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">{topicError || (q ? "No public Topics match this search." : "No public Topics are available yet.")}</div>}</section> : null}

      {cat === "All" || cat === "Watch" || cat === "Creators" ? <section><SectionHeader title="Watch" subtitle="Useful knowledge from creators." action={<Link to="/creators" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">Creators <ArrowUpRight className="size-3.5" /></Link>} /><div className="grid gap-4 sm:grid-cols-2">{videos.map((v) => <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />)}</div></section> : null}

      {cat === "All" || cat === "Opportunities" ? <section><SectionHeader title="People, places and opportunities" subtitle={`${results.length} illustrative examples while connected discovery expands`} /><div className="grid gap-3 sm:grid-cols-2">{results.map((e) => <EntityCard key={e.id} entity={e} />)}</div>{exploreAd ? <div className="mt-3"><SponsoredExploreCard campaign={exploreAd} /></div> : null}</section> : null}

      <section className="rounded-[22px] border border-border bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Need the full map?</p><h2 className="mt-1 text-[17px] font-semibold">Browse every capability</h2><p className="mt-1 text-[11.5px] text-muted-foreground">The detailed catalogue stays available when you need a specific path.</p></div><Link to="/capabilities" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[11.5px] font-medium text-primary-foreground">Browse capabilities <ArrowRight className="size-3.5" /></Link></div></section>

      <IntegrationGap>Availability is only shown as confirmed when Kurukoo can verify it.</IntegrationGap>
    </div>
  );
}
