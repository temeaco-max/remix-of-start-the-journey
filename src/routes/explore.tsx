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
import { AdSlot, Chips, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import { fetchCanonicalTopics, type CanonicalTopic } from "@/lib/kurukoo-api";
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

function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(categories[0]);
  const [topicData, setTopicData] = useState<CanonicalTopic[]>([]);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicRefreshing, setTopicRefreshing] = useState(false);
  const [topicError, setTopicError] = useState("");
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

  useEffect(() => {
    void loadTopics();
  }, []);

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
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">
              What are you looking for?
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Search first, or tell Kurukoo what you want and let it coordinate the next step.
            </p>
          </div>
        </div>
        <div className="relative mt-5">
          <SearchField
            label="Search Kurukoo"
            placeholder="Search people, places, topics…"
            value={q}
            onChange={setQ}
          />
        </div>
        <div className="relative mt-3">
          <Chips items={categories} value={cat} onChange={setCat} label="Discovery categories" />
        </div>
      </section>
      <section>
        <SectionHeader
          title="Three ways to discover"
          subtitle="These surfaces do different jobs. Explore is deliberate search; Nearby is the local world; Radar is what Kurukoo thinks is worth noticing."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            to="/explore"
            className="group rounded-[20px] border border-primary/20 bg-brand-tint/25 p-5"
          >
            <Compass className="size-5 text-primary" />
            <h3 className="mt-3 text-[15px] font-semibold">Explore</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Search the wider Kurukoo network: people, providers, businesses, creators, Topics,
              opportunities and useful content.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">
              Search the network <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
          <Link
            to="/discover"
            className="group rounded-[20px] border border-border bg-surface p-5 hover:bg-elevated/50"
          >
            <MapPin className="size-5 text-muted-foreground" />
            <h3 className="mt-3 text-[15px] font-semibold">Nearby</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              See the local world around you: moving providers, shops, offers, events and other
              useful nearby activity.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">
              Open Nearby <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
          <Link
            to="/discover"
            className="group rounded-[20px] border border-border bg-elevated/40 p-5 hover:bg-elevated/65"
          >
            <Zap className="size-5 text-primary" />
            <h3 className="mt-3 text-[15px] font-semibold">Radar</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Your attention layer. Radar can surface a nearby live signal, useful opportunity or
              timely change that matches your context.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">
              See local attention <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>
      </section>
      <section>
        <SectionHeader
          title="Daily Picks"
          subtitle="A quick starting point for today."
          action={
            <Link
              to="/daily-picks"
              className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              See all <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
        <DailyPicksGrid />
      </section>
      <section>
        <SectionHeader title="Start a request" subtitle="Hand a useful task straight to Kurukoo." />
        <div className="flex flex-wrap gap-2">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                send(s);
                navigate({ to: "/" });
              }}
              className="min-h-9 rounded-full border border-border bg-surface px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </section>
      {showEntities ? (
        <section>
          <SectionHeader
            title={cat === "All" ? "People, places and opportunities" : cat}
            subtitle={`${results.length} results`}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <AdSlot
              placement="Explore feed"
              headline="Sponsored result"
              body="Sponsored results are clearly separated from organic discovery."
              advertiser="Example advertiser"
            />
            <AdSlot
              placement="Explore feed"
              headline="Sponsored result"
              body="Sponsored results are clearly separated from organic discovery."
              advertiser="Example advertiser"
            />
          </div>
        </section>
      ) : null}
      {cat === "All" || cat === "Topics" ? (
        <section>
          <SectionHeader
            title="Topics"
            subtitle="Community conversation with context — never fulfilment proof."
            action={
              <Link
                to="/topics"
                className="inline-flex items-center gap-1 text-[13px] text-muted-foreground"
              >
                All Topics <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Moderated public context
            </div>
            <button
              type="button"
              onClick={() => void loadTopics(true)}
              disabled={topicRefreshing}
              className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={topicRefreshing ? "size-3.5 animate-spin" : "size-3.5"} />{" "}
              Refresh
            </button>
          </div>
          {topicLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-[18px] border border-border bg-surface"
                />
              ))}
            </div>
          ) : filteredTopics.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTopics.map((topic) => (
                <ExploreTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">
              {topicError ||
                (q
                  ? "No public Topics match this search."
                  : "No public Topics are available yet. Kurukoo does not fabricate community activity.")}
            </div>
          )}
        </section>
      ) : null}
      {cat === "All" || cat === "Watch" || cat === "Creators" ? (
        <section>
          <SectionHeader
            title="Watch"
            subtitle="Useful knowledge from creators."
            action={
              <Link
                to="/creators"
                className="inline-flex items-center gap-1 text-[13px] text-muted-foreground"
              >
                Creators <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
            ))}
          </div>
        </section>
      ) : null}
      {cat === "All" || cat === "Opportunities" ? (
        <section>
          <SectionHeader
            title="Opportunities"
            subtitle="Useful ways to participate, earn or collaborate."
            action={
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1 text-[13px] text-muted-foreground"
              >
                See opportunities <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/opportunities"
              className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-elevated">
                <BriefcaseBusiness className="size-4" />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold">Find work and collaborations</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                See opportunities that can become useful requests or introductions.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium">
                Open opportunities <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
            <Link
              to="/how-it-works"
              className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/50"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-elevated">
                <Sparkles className="size-4" />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold">Understand the system</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                See how discovery becomes coordination and where you stay in control.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium">
                How it works <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </section>
      ) : null}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Sparkles className="size-3.5" />
        Community context comes from real public Topics; verified availability remains a separate
        discovery signal.
      </div>
      <IntegrationGap>
        Availability is only shown as confirmed when Kurukoo can verify it.
      </IntegrationGap>
    </div>
  );
}
