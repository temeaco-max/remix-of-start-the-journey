import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { AdSlot, Badge, Panel, Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { campaigns } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/advertising")({
  head: () => ({
    meta: [
      { title: "Advertising — Kurukoo" },
      {
        name: "description",
        content:
          "Create clearly labelled sponsored discovery across Kurukoo and understand campaign performance.",
      },
      { property: "og:title", content: "Advertising — Kurukoo" },
      {
        property: "og:description",
        content: "Reach people when your service or idea is relevant to what they are exploring.",
      },
    ],
  }),
  component: AdvertisingPage,
});

const tabs = ["Campaigns", "Create", "Placements", "Billing"] as const;

function AdvertisingPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  return (
    <>
      <PageHeader
        title="Advertising"
        subtitle="Reach people when your service, offer or idea is relevant to what they are doing."
      />
      <Tabs items={tabs} value={tab} onChange={setTab} />
      {tab === "Campaigns" ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Spend (30 days)" value="£170.10" note="Sample campaign data" />
            <StatTile label="Impressions" value="82,084" note="Sample campaign data" />
            <StatTile label="Conversions" value="125" note="Sample campaign data" />
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
          <p className="text-[12.5px] text-muted-foreground">
            The figures shown here are sample data. Live campaign delivery and measurement are
            coming soon.
          </p>
        </div>
      ) : null}
      {tab === "Create" ? (
        <Panel className="mt-4 p-4">
          <SectionHeader
            title="Create a campaign"
            subtitle="Choose what you want to achieve, who should see it, where it appears and how much you want to spend."
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-elevated px-3 py-3">
              <p className="text-[12.5px] font-medium">Goal</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Requests, follows or visits
              </p>
            </div>
            <div className="rounded-xl bg-elevated px-3 py-3">
              <p className="text-[12.5px] font-medium">Audience</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">Topic, location and intent</p>
            </div>
            <div className="rounded-xl bg-elevated px-3 py-3">
              <p className="text-[12.5px] font-medium">Creative</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">Headline, copy and image</p>
            </div>
            <div className="rounded-xl bg-elevated px-3 py-3">
              <p className="text-[12.5px] font-medium">Placement</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Explore, Daily Picks, search, topics and creator discovery
              </p>
            </div>
            <div className="rounded-xl bg-elevated px-3 py-3">
              <p className="text-[12.5px] font-medium">Budget</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">Daily budget and schedule</p>
            </div>
          </div>
          <div className="mt-4">
            <Action variant="primary">Save campaign draft</Action>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Campaign publishing and billing are coming soon.
          </p>
        </Panel>
      ) : null}
      {tab === "Placements" ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13.5px] text-muted-foreground">
            Sponsored content is clearly labelled and kept distinct from organic recommendations.
          </p>
          {["Explore feed", "Daily Picks", "Search results", "Topic feed", "Creator discovery"].map(
            (p) => (
              <AdSlot
                key={p}
                placement={p}
                headline="Sponsored discovery"
                body="A relevant service, offer or idea can appear here."
                advertiser="Advertiser"
              />
            ),
          )}
        </div>
      ) : null}
      {tab === "Billing" ? (
        <Panel className="mt-4 p-4">
          <p className="text-[15px] font-medium">Advertising billing</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
            Payment methods, invoices, spend limits and campaign charges will appear here when
            advertising billing is connected.
          </p>
          <div className="mt-4">
            <Action>Add payment method</Action>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
