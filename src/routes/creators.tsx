import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard, VideoCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { entities, entityById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/creators")({
  head: () => ({
    meta: [
      { title: "Creators — Kurukoo" },
      { name: "description", content: "Watch practical content from Kurukoo creators, or publish your own." },
      { property: "og:title", content: "Creators — Kurukoo" },
      { property: "og:description", content: "Creator channels, videos and publishing tools." },
    ],
  }),
  component: CreatorsPage,
});

const tabs = ["Watch", "Creators", "Creator studio"] as const;

function CreatorsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const creators = entities.filter((e) => e.kind === "creator");

  return (
    <>
      <PageHeader title="Creators" subtitle="People explaining the things you're about to ask for." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "Watch" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
          ))}
        </div>
      ) : null}

      {tab === "Creators" ? (
        <div className="mt-4 grid gap-3">
          {creators.map((c) => (
            <EntityCard key={c.id} entity={c} />
          ))}
        </div>
      ) : null}

      {tab === "Creator studio" ? (
        <div className="mt-4 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Subscribers" value="0" note="Prototype" />
            <StatTile label="Views (30 days)" value="0" note="Prototype" />
            <StatTile label="Earnings" value="—" note="Not connected" />
          </div>
          <section>
            <SectionHeader title="Publishing" subtitle="Upload, describe, place in topics, publish." />
            <Rows>
              {[
                ["New video", "Upload and add a thumbnail"],
                ["Content library", "Everything you've published"],
                ["Topics and placement", "Where your content appears"],
                ["Comments and discussion", "Replies from viewers"],
                ["Channel settings", "Name, description, links"],
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
            <div className="mt-3 flex gap-2">
              <Action variant="primary">Upload video</Action>
              <Link to="/subscriptions">
                <Action>Creator plan</Action>
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      <IntegrationGap>
        Uploading, subscriptions and earnings need the creator backend. Videos are placeholders.
      </IntegrationGap>
    </>
  );
}
