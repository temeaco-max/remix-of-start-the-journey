import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { AdSlot, Badge, Panel, Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { campaigns } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/advertising")({
  head: () => ({
    meta: [
      { title: "Advertising — Kurukoo" },
      { name: "description", content: "Campaigns, budgets, placements and performance for businesses on Kurukoo." },
      { property: "og:title", content: "Advertising — Kurukoo" },
      { property: "og:description", content: "Run clearly-labelled sponsored placements across Kurukoo." },
    ],
  }),
  component: AdvertisingPage,
});

const tabs = ["Campaigns", "Create", "Placements", "Billing"] as const;

function AdvertisingPage() {
  const [tab, setTab] = useState<string>(tabs[0]);

  return (
    <>
      <PageHeader title="Advertising" subtitle="Reach people at the moment they ask for something." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "Campaigns" ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Spend (30 days)" value="£170.10" note="Prototype" />
            <StatTile label="Impressions" value="82,084" note="Prototype" />
            <StatTile label="Conversions" value="125" note="Prototype" />
          </div>
          <Rows>
            {campaigns.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15.5px] font-medium">{c.name}</p>
                  <Badge tone={c.status === "active" ? "success" : "quiet"}>{c.status}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {c.budget} · {c.spend} spent · {c.placement}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {c.impressions} impressions · {c.clicks} clicks · {c.conversions} conversions
                </p>
                <div className="mt-3 flex gap-2">
                  <Action>{c.status === "active" ? "Pause" : "Resume"}</Action>
                  <Action>Edit</Action>
                </div>
              </li>
            ))}
          </Rows>
        </div>
      ) : null}

      {tab === "Create" ? (
        <Panel className="mt-4 p-4">
          <SectionHeader title="New campaign" subtitle="Audience, creative, budget and schedule." />
          <ul className="space-y-3 text-[14px]">
            {[
              "Objective — requests, follows or visits",
              "Audience — topic, location and intent",
              "Creative — headline, body and image",
              "Placement — Explore, Daily Picks, topics, discovery",
              "Daily budget and schedule",
            ].map((f) => (
              <li key={f} className="rounded-lg border border-border px-3 py-2.5 text-muted-foreground">
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Action variant="primary">Save draft</Action>
          </div>
        </Panel>
      ) : null}

      {tab === "Placements" ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13.5px] text-muted-foreground">
            Sponsored content always looks different from organic recommendations.
          </p>
          {["Explore feed", "Daily Picks", "Search results", "Topic feed", "Creator discovery"].map((p) => (
            <AdSlot
              key={p}
              placement={p}
              headline="Your placement here"
              body="Reusable AdSlot primitive — the advertising backend will populate it."
              advertiser="Example advertiser"
            />
          ))}
        </div>
      ) : null}

      {tab === "Billing" ? (
        <Panel className="mt-4 p-4">
          <p className="text-[15px] font-medium">Advertising billing</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Invoices, payment method and spend limits will appear here.
          </p>
        </Panel>
      ) : null}

      <IntegrationGap>
        All advertising figures are demo values. No campaign is served or measured.
      </IntegrationGap>
    </>
  );
}
