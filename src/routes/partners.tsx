import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { entities } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners — Kurukoo" },
      {
        name: "description",
        content: "Organisations working with Kurukoo to deliver services at scale.",
      },
      { property: "og:title", content: "Partners — Kurukoo" },
      { property: "og:description", content: "Partner organisations in the Kurukoo ecosystem." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <MarketingPage>
      <PageHeader title="Partners" subtitle="Organisations delivering alongside Kurukoo." />
      <div className="grid gap-3">
        {entities
          .filter((e) => e.kind === "partner")
          .map((e) => (
            <EntityCard key={e.id} entity={e} />
          ))}
      </div>
      <IntegrationGap>Partnership status and capabilities are illustrative.</IntegrationGap>
    </MarketingPage>
  );
}
