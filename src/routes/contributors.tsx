import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { entities } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/contributors")({
  head: () => ({
    meta: [
      { title: "Contributors — Kurukoo" },
      { name: "description", content: "The people shaping Kurukoo: research, accessibility, moderation and curation." },
      { property: "og:title", content: "Contributors — Kurukoo" },
      { property: "og:description", content: "People contributing to how Kurukoo works." },
    ],
  }),
  component: ContributorsPage,
});

function ContributorsPage() {
  return (
    <MarketingPage>
      <PageHeader title="Contributors" subtitle="People shaping how Kurukoo behaves." />
      <div className="grid gap-3">
        {entities
          .filter((e) => e.kind === "contributor")
          .map((e) => (
            <EntityCard key={e.id} entity={e} />
          ))}
      </div>
      <IntegrationGap>Contribution history and recognition are not tracked yet.</IntegrationGap>
    </MarketingPage>
  );
}
