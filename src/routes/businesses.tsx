import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { entities } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/businesses")({
  head: () => ({
    meta: [
      { title: "Businesses — Kurukoo" },
      {
        name: "description",
        content:
          "Discover businesses, or run yours on Kurukoo: requests, customers, advertising and analytics.",
      },
      { property: "og:title", content: "Businesses — Kurukoo" },
      {
        property: "og:description",
        content: "Where businesses meet people who are already asking.",
      },
    ],
  }),
  component: BusinessesPage,
});

const tabs = ["Discover", "Your business"] as const;

function BusinessesPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const list = entities.filter((e) => e.kind === "business");

  return (
    <>
      <PageHeader
        title="Businesses"
        subtitle="Services, products and teams people can reach through Kurukoo."
      />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "Discover" ? (
        <div className="mt-4 grid gap-3">
          {list.map((b) => (
            <EntityCard key={b.id} entity={b} />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Incoming requests" value="0" note="Prototype" />
            <StatTile label="Customers" value="0" note="Prototype" />
            <StatTile label="Ad spend" value="£0.00" note="Prototype" />
          </div>
          <section>
            <SectionHeader title="Business tools" />
            <Rows>
              {[
                ["Profile and location", "How customers find you"],
                ["Services and products", "What you sell"],
                ["Team", "Who can respond"],
                ["Requests and work", "Jobs in progress"],
                ["Messages", "Customer conversations"],
                ["Analytics", "Demand and performance"],
                ["Advertising", "Sponsored placements"],
                ["Subscriptions and payments", "Plan and billing"],
                ["Verification", "Trust and safety"],
              ].map(([title, note]) => (
                <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block text-[15px]">{title}</span>
                    <span className="block text-[13px] text-muted-foreground">{note}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted-foreground">Prototype</span>
                </li>
              ))}
            </Rows>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/advertising">
                <Action variant="primary">Advertising</Action>
              </Link>
              <Link to="/subscriptions">
                <Action>Subscription</Action>
              </Link>
              <Link to="/settings">
                <Action>Settings</Action>
              </Link>
            </div>
          </section>
        </div>
      )}

      <IntegrationGap>Business accounts are visual only in this prototype.</IntegrationGap>
    </>
  );
}
