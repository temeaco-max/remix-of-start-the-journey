import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { RecommendationCard, VideoCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { AdSlot, SectionHeader } from "@/components/kurukoo/ui";
import { entities, entityById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/daily-picks")({
  head: () => ({
    meta: [
      { title: "Daily Picks — Kurukoo" },
      {
        name: "description",
        content: "A short, useful set of providers, businesses, creators and topics for today.",
      },
      { property: "og:title", content: "Daily Picks — Kurukoo" },
      {
        property: "og:description",
        content: "Today's short list, chosen around what you've asked for.",
      },
    ],
  }),
  component: DailyPicksPage,
});

export function DailyPicksGrid({ limit = 3 }: { limit?: number }) {
  const picks = entities.filter((e) => e.kind !== "contributor").slice(0, limit);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {picks.map((e) => (
        <RecommendationCard
          key={e.id}
          title={e.name}
          reason={e.tagline}
          meta={e.location ?? e.kind}
          to={
            <Link
              to="/profile/$entityId"
              params={{ entityId: e.id }}
              className="text-[13.5px] underline"
            >
              View
            </Link>
          }
        />
      ))}
      <RecommendationCard
        sponsored
        title="Autumn boiler service"
        reason="A sponsored recommendation slot, clearly marked apart from organic picks."
        meta="Example advertiser"
      />
    </div>
  );
}

function DailyPicksPage() {
  return (
    <>
      <PageHeader title="Daily Picks" subtitle="A short list worth your attention today." />
      <DailyPicksGrid limit={4} />

      <section className="mt-8">
        <SectionHeader title="Watch today" />
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.slice(0, 2).map((v) => (
            <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
          ))}
        </div>
      </section>

      <div className="mt-8">
        <AdSlot
          placement="Daily Picks"
          headline="Sponsored placement"
          body="Advertising slots sit inside Daily Picks but never imitate organic recommendations."
          advertiser="Example advertiser"
        />
      </div>

      <IntegrationGap>
        Picks are demo content. Personalisation and ranking need the recommendation backend.
      </IntegrationGap>
    </>
  );
}
