import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Compass,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
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
import { useKurukoo } from "@/lib/kurukoo-store";
import { DailyPicksGrid } from "@/routes/daily-picks";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Kurukoo" },
      {
        name: "description",
        content:
          "Discover people, businesses, services, creators, topics, opportunities and useful content.",
      },
      { property: "og:title", content: "Explore — Kurukoo" },
      {
        property: "og:description",
        content: "Discover useful people, places, ideas, services and opportunities.",
      },
    ],
  }),
  component: ExplorePage,
});

const categories = [
  "All",
  "Network",
  "Businesses",
  "Creators",
  "Topics",
  "Watch",
  "Opportunities",
] as const;

const starters = [
  "Find me a plumber.",
  "Book me a dentist.",
  "I need someone to repair my phone.",
  "Get my boiler serviced.",
];

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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[14.5px] font-semibold">{entity.name}</h3>
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[9.5px] font-medium">
              {evidence}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {pretty(entity.category ?? entity.kind)}
            {entity.location ? ` · ${entity.location}` : ""}
          </p>
        </div>
        <span
          className={
            available
              ? "shrink-0 rounded-full bg-brand-tint px-2 py-1 text-[9.5px] font-medium text-brand-ink"
              : "shrink-0 rounded-full bg-elevated px-2 py-1 text-[9.5px] font-medium text-muted-foreground"
          }
        >
          {availabilityLabel(entity)}
        </span>
      </div>
      {entity.description ? (
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {entity.description}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        {entity.freshness ? <span>{entity.freshness}</span> : null}
        {entity.lifecycle ? <span>· {pretty(entity.lifecycle)}</span> : null}
        {entity.source ? <span>· {entity.source}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/chat"
          search={{ query: entity.chatAction?.entityId ? entity.name : `Help me with ${entity.name}` } as never}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground"
        >
          Ask Kurukoo <ArrowUpRight className="size-3.5" />
        </Link>
        {entity.chatAction?.type ? (
          <span className="inline-flex min-h-8 items-center rounded-lg border border-border px-3 text-[10.5px] text-muted-foreground">
            {pretty(entity.chatAction.type)}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ExploreTopicCard({ topic }: { topic: CanonicalTopic }) {
  const locality = [topic.city, topic.lga].filter(Boolean).join(" · ");
  return (
    <Link
      to="/topics/$slug"
      params={{ slug: topic.slug }}
      className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-elevated px-2 py-1 font-medium text-foreground/80">
            {pretty(topic.type)}
          </span>
          {topic.category ? (
            <span className="rounded-full bg-elevated px-2 py-1">{pretty(topic.category)}</span>
          ) : null}
          {locality ? <span className="rounded-full bg-elevated px-2 py-1">{locality}</span> : null}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <h3 className="mt-4 text-[15.5px] font-medium leading-snug">{topic.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
        {topic.body}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          {topic.replyCount} {topic.replyCount === 1 ? "moderated reply" : "moderated replies"}
        </span>
        <span>·</span>
        <span>{topic.authorLabel}</span>
      </div>
    </Link>
  );
}

function SponsoredExploreCard({ campaign }: { campaign: AuthenticatedAd }) {
  return (
    <a
      href={campaign.clickUrl}
      rel="nofollow"
      className="block rounded-[18px] border border-border bg-elevated/45 p-4 transition-colors hover:bg-elevated"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {campaign.disclosure}
        </p>
        <ArrowUpRight className="size-3 text-muted-foreground" />
      </div>
      <p className="mt-2 text-[13.5px] font-semibold">{campaign.title}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{campaign.desc}</p>
      <span className="mt-2 inline-flex text-[10.5px] font-medium">{campaign.ctaText}</span>
    </a>
  );
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
    if (refresh) setTopicRefreshing(true);
    else setTopicLoading(true);
    try {
      setTopicData(await fetchCanonicalTopics(6));
      setTopicError("");
    } catch (error) {
      setTopicData([]);
      setTopicError(
        error instanceof Error ? error.message : "Community context is unavailable right now.",
      );
    } finally {
      setTopicLoading(false);
      setTopicRefreshing(false);
    }
  }

  async function loadDiscovery() {
    setDiscoveryLoading(true);
    try {
      setDiscoveryData(await fetchDiscoveryEntities({ radius: 5000, q: q.trim() || undefined }));
      setDiscoveryError("");
    } catch (error) {
      setDiscoveryData([]);
      setDiscoveryError(
        error instanceof Error ? error.message : "Live discovery is unavailable right now.",
      );
    } finally {
      setDiscoveryLoading(false);
    }
  }

  useEffect(() => {
    void loadTopics();
    void loadDiscovery();
    void fetchAuthenticatedAd("desk-content").then(setExploreAd).catch(() => setExploreAd(null));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDiscovery(), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entities.filter((e) => {
      const kindOk =
        cat === "All" ||
        (cat === "Network" && e.kind === "provider") ||
        (cat === "Businesses" && e.kind === "business") ||
        (cat === "Creators" && e.kind === "creator") ||
        (cat === "Opportunities" && ["partner", "contributor"].includes(e.kind));
      return (
        kindOk && (!term || (e.name + e.tagline + e.topics.join(" ")).toLowerCase().includes(term))
      );
    });
  }, [q, cat]);

  const liveResults = useMemo(() => {
    const term = q.trim().toLowerCase();
    return discoveryData.filter((entity) => {
      const text = [
        entity.name,
        entity.kind,
        entity.category ?? "",
        entity.description ?? "",
        entity.location ?? "",
        ...(entity.skills ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (term && !text.includes(term)) return false;
      if (cat === "Network") return ["provider", "person", "agent", "mobile", "stationary"].some((k) => entity.kind.toLowerCase().includes(k));
      if (cat === "Businesses") return ["business", "place", "shop", "venue"].some((k) => entity.kind.toLowerCase().includes(k));
      if (cat === "Creators") return entity.kind.toLowerCase().includes("creator");
      if (cat === "Opportunities") return ["opportun", "partner", "contributor"].some((k) => entity.kind.toLowerCase().includes(k));
      return cat === "All";
    });
  }, [cat, discoveryData, q]);

  const filteredTopics = useMemo(() => {
    const term = q.trim().toLowerCase();
    return topicData.filter(
      (topic) =>
        !term ||
        [
          topic.title,
          topic.body,
          topic.type,
          topic.category ?? "",
          ...topic.skills,
          topic.city ?? "",
          topic.lga ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
    );
  }, [q, topicData]);

  const showEntities =
    cat === "All" ||
    cat === "Network" ||
    cat === "Businesses" ||
    cat === "Creators" ||
    cat === "Opportunities";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Explore"
        subtitle="Find people, places, ideas and opportunities — then hand the useful part to Kurukoo."
      />
      <section className="relative overflow-hidden rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-brand-tint/60 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink">
            <Compass className="size-[18px]" />
          </span>
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">Discovery</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">What are you looking for?</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Search first, or tell Kurukoo what you want and let it coordinate the next step.
            </p>
          </div>
        </div>
        <div className="relative mt-5">
          <SearchField label="Search Kurukoo" placeholder="Search people, places, topics…" value={q} onChange={setQ} />
        </div>
        <div className="relative mt-3">
          <Chips items={categories} value={cat} onChange={setCat} label="Discovery categories" />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Three ways to discover"
          subtitle="Explore is deliberate search; Nearby is the local world; Radar is what Kurukoo thinks is worth noticing."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/explore" className="group rounded-[20px] border border-primary/20 bg-brand-tint/25 p-5">
            <Compass className="size-5 text-primary" />
            <h3 className="mt-3 text-[15px] font-semibold">Explore</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Search the wider Kurukoo network: people, providers, businesses, creators, Topics, opportunities and useful content.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">Search the network <ArrowUpRight className="size-3.5" /></span>
          </Link>
          <Link to="/discover" className="group rounded-[20px] border border-border bg-surface p-5 hover:bg-elevated/50">
            <MapPin className="size-5 text-muted-foreground" />
            <h3 className="mt-3 text-[15px] font-semibold">Nearby</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">See the local world around you: moving providers, shops, offers, events and other useful nearby activity.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">Open Nearby <ArrowUpRight className="size-3.5" /></span>
          </Link>
          <Link to="/discover" className="group rounded-[20px] border border-border bg-elevated/40 p-5 hover:bg-elevated/65">
            <Zap className="size-5 text-primary" />
            <h3 className="mt-3 text-[15px] font-semibold">Radar</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Your attention layer. Radar can surface a nearby live signal, useful opportunity or timely change that matches your context.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">See local attention <ArrowUpRight className="size-3.5" /></span>
          </Link>
        </div>
      </section>

      <section>
        <SectionHeader title="Daily Picks" subtitle="A quick starting point for today." action={<Link to="/daily-picks" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">See all <ArrowUpRight className="size-3.5" /></Link>} />
        <DailyPicksGrid />
      </section>

      <section>
        <SectionHeader title="Start a request" subtitle="Hand a useful task straight to Kurukoo." />
        <div className="flex flex-wrap gap-2">
          {starters.map((s) => (
            <button key={s} type="button" onClick={() => { send(s); navigate({ to: "/" }); }} className="min-h-9 rounded-full border border-border bg-surface px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground">{s}</button>
          ))}
        </div>
      </section>

      {showEntities ? (
        <>
          <section>
            <SectionHeader title="Live discovery" subtitle="Canonical discovery signals carry evidence, freshness and availability state. They are separate from community opinion." action={<button type="button" onClick={() => void loadDiscovery()} className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"><RefreshCw className="size-3.5" /> Refresh</button>} />
            {discoveryLoading ? (
              <div className="grid gap-3 md:grid-cols-2"><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /><div className="h-36 animate-pulse rounded-[18px] border border-border bg-surface" /></div>
            ) : liveResults.length ? (
              <div className="grid gap-3 md:grid-cols-2">{liveResults.slice(0, 8).map((entity) => <DiscoveryEntityCard key={entity.id} entity={entity} />)}</div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">{discoveryError || "No canonical discovery signals match this view yet. Kurukoo does not manufacture availability."}</div>
            )}
          </section>
          <section>
            <SectionHeader title={cat === "All" ? "People, places and opportunities" : cat} subtitle={`${results.length} illustrative examples while connected discovery expands`} />
            <div className="grid gap-3 md:grid-cols-2">{results.map((e) => <EntityCard key={e.id} entity={e} />)}</div>
          </section>
          {exploreAd ? <section><SponsoredExploreCard campaign={exploreAd} /></section> : null}
        </>
      ) : null}

      {cat === "All" || cat === "Topics" ? (
        <section>
          <SectionHeader title="Topics" subtitle="Community conversation with context — never fulfilment proof." action={<Link to="/topics" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">All Topics <ArrowUpRight className="size-3.5" /></Link>} />
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground"><ShieldCheck className="size-3.5" /> Moderated public context</div>
            <button type="button" onClick={() => void loadTopics(true)} disabled={topicRefreshing} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground disabled:opacity-50"><RefreshCw className={topicRefreshing ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh</button>
          </div>
          {topicLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[18px] border border-border bg-surface" />)}</div>
          ) : filteredTopics.length ? (
            <div className="grid gap-3 sm:grid-cols-2">{filteredTopics.map((topic) => <ExploreTopicCard key={topic.id} topic={topic} />)}</div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">{topicError || (q ? "No public Topics match this search." : "No public Topics are available yet. Kurukoo does not fabricate community activity.")}</div>
          )}
        </section>
      ) : null}

      {cat === "All" || cat === "Watch" || cat === "Creators" ? (
        <section>
          <SectionHeader title="Watch" subtitle="Useful knowledge from creators." action={<Link to="/creators" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">Creators <ArrowUpRight className="size-3.5" /></Link>} />
          <div className="grid gap-4 sm:grid-cols-2">{videos.map((v) => <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />)}</div>
        </section>
      ) : null}

      {cat === "All" || cat === "Opportunities" ? (
        <section>
          <SectionHeader title="Opportunities" subtitle="Useful ways to participate, earn or collaborate." action={<Link to="/opportunities" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">See opportunities <ArrowUpRight className="size-3.5" /></Link>} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/opportunities" className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50">
              <span className="grid size-9 place-items-center rounded-xl bg-elevated"><BriefcaseBusiness className="size-4" /></span>
              <h3 className="mt-4 text-[14px] font-semibold">Find work and collaborations</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">See opportunities that can become useful requests or introductions.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium">Open opportunities <ArrowUpRight className="size-3.5" /></span>
            </Link>
            <Link to="/how-it-works" className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50">
              <span className="grid size-9 place-items-center rounded-xl bg-elevated"><Sparkles className="size-4" /></span>
              <h3 className="mt-4 text-[14px] font-semibold">Understand the system</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">See how discovery becomes coordination and where you stay in control.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium">How it works <ArrowUpRight className="size-3.5" /></span>
            </Link>
          </div>
        </section>
      ) : null}

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Sparkles className="size-3.5" /> Community context comes from real public Topics; verified availability remains a separate discovery signal.</div>
      <IntegrationGap>Availability is only shown as confirmed when Kurukoo can verify it.</IntegrationGap>
    </div>
  );
}
