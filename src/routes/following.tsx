import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ContactRow, TopicCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { FollowButton, Rows, Tabs } from "@/components/kurukoo/ui";
import { entities, topics } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/following")({
  head: () => ({
    meta: [
      { title: "Following — Kurukoo" },
      {
        name: "description",
        content: "People, providers, businesses, creators and topics you follow.",
      },
      { property: "og:title", content: "Following — Kurukoo" },
      { property: "og:description", content: "Your Kurukoo network in one place." },
    ],
  }),
  component: FollowingPage,
});

const tabs = ["People", "Providers", "Businesses", "Creators", "Topics"] as const;

function FollowingPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const kind =
    tab === "People"
      ? "person"
      : tab === "Providers"
        ? "provider"
        : tab === "Businesses"
          ? "business"
          : "creator";
  const list = entities.filter((e) => e.kind === kind);

  return (
    <>
      <PageHeader title="Following" subtitle="The network behind your requests." />
      <Tabs items={tabs} value={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "Topics" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <TopicCard key={t.slug} topic={t} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-[14px] text-muted-foreground">
            Nothing followed here yet.{" "}
            <Link to="/explore" className="underline">
              Explore
            </Link>{" "}
            to find people.
          </p>
        ) : (
          <Rows>
            {list.map((e) => (
              <ContactRow key={e.id} entity={e} right={<FollowButton small />} />
            ))}
          </Rows>
        )}
      </div>
      <IntegrationGap>Follows are not persisted yet — they reset when you reload.</IntegrationGap>
    </>
  );
}
