import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard, TopicCard, VideoCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { AdSlot, Chips, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import { entities, entityById, topics, videos } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";
import { DailyPicksGrid } from "@/routes/daily-picks";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Kurukoo" },
      {
        name: "description",
        content: "Discover providers, businesses, services, creators, topics and content.",
      },
      { property: "og:title", content: "Explore — Kurukoo" },
      { property: "og:description", content: "The discovery layer of Kurukoo." },
    ],
  }),
  component: ExplorePage,
});

const categories = ["All", "Providers", "Businesses", "Creators", "Topics", "Watch"] as const;

const starters = [
  "Find me a plumber.",
  "Book me a dentist.",
  "I need someone to repair my phone.",
  "Get my boiler serviced.",
];

function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(categories[0]);
  const { send } = useKurukoo();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entities.filter((e) => {
      const kindOk =
        cat === "All" ||
        (cat === "Providers" && e.kind === "provider") ||
        (cat === "Businesses" && e.kind === "business") ||
        (cat === "Creators" && e.kind === "creator");
      if (!kindOk) return false;
      if (!term) return true;
      return (e.name + e.tagline + e.topics.join(" ")).toLowerCase().includes(term);
    });
  }, [q, cat]);

  const showEntities =
    cat === "All" || cat === "Providers" || cat === "Businesses" || cat === "Creators";

  return (
    <>
      <PageHeader
        title="Explore"
        subtitle="Find people, businesses and ideas — then hand it to Kurukoo."
      />

      <div className="space-y-3">
        <SearchField
          label="Search Kurukoo"
          placeholder="Search providers, topics, creators…"
          value={q}
          onChange={setQ}
        />
        <Chips items={categories} value={cat} onChange={setCat} label="Discovery categories" />
        <p className="text-[12.5px] text-muted-foreground">
          Results are not location-aware yet — location context arrives with the backend.
        </p>
      </div>

      <section className="mt-8">
        <SectionHeader
          title="Daily Picks"
          subtitle="Chosen around what you've been asking for."
          action={
            <Link to="/daily-picks" className="text-[13.5px] underline">
              See all
            </Link>
          }
        />
        <DailyPicksGrid />
      </section>

      <section className="mt-8">
        <SectionHeader title="Start a request" subtitle="Tap to hand it straight to Kurukoo." />
        <div className="flex flex-wrap gap-2">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                send(s);
                navigate({ to: "/" });
              }}
              className="min-h-9 rounded-full border border-border bg-surface px-3.5 text-[13.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {showEntities ? (
        <section className="mt-8">
          <SectionHeader
            title={cat === "All" ? "People and places" : cat}
            subtitle={`${results.length} results`}
          />
          <div className="grid gap-3">
            {results.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
          <div className="mt-3">
            <AdSlot
              placement="Explore feed"
              headline="Sponsored result"
              body="Sponsored results are visually separated from organic discovery."
              advertiser="Example advertiser"
            />
          </div>
        </section>
      ) : null}

      {cat === "All" || cat === "Topics" ? (
        <section className="mt-8">
          <SectionHeader
            title="Topics"
            action={
              <Link to="/topics" className="text-[13.5px] underline">
                All topics
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <TopicCard key={t.slug} topic={t} />
            ))}
          </div>
        </section>
      ) : null}

      {cat === "All" || cat === "Watch" || cat === "Creators" ? (
        <section className="mt-8">
          <SectionHeader
            title="Watch"
            action={
              <Link to="/creators" className="text-[13.5px] underline">
                Creators
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

      <IntegrationGap>
        Discovery runs on prototype data — no live directory, ranking or availability yet.
      </IntegrationGap>
    </>
  );
}
