import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Badge, Panel, Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { entities } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Providers — Kurukoo" },
      {
        name: "description",
        content:
          "Find a provider, or run your own provider account: requests, work, messages and earnings.",
      },
      { property: "og:title", content: "Providers — Kurukoo" },
      {
        property: "og:description",
        content: "Where tradespeople and specialists meet real requests.",
      },
    ],
  }),
  component: ProvidersPage,
});

const tabs = ["Find a provider", "Your provider account"] as const;

function ProvidersPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const providers = entities.filter((e) => e.kind === "provider");

  return (
    <>
      <PageHeader title="Providers" subtitle="The people who actually do the work." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "Find a provider" ? (
        <div className="mt-4 grid gap-3">
          {providers.map((p) => (
            <EntityCard key={p.id} entity={p} />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15.5px] font-medium">Become a provider</p>
              <Badge tone="quiet">Not verified</Badge>
            </div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Add your services, coverage and availability. Verification keeps customers safe.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Action variant="primary">Start onboarding</Action>
              <Action>Verify identity</Action>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Open requests" value="0" note="Prototype" />
            <StatTile label="Active work" value="0" note="Prototype" />
            <StatTile label="Earnings" value="£0.00" note="No payouts connected" />
          </div>

          <section>
            <SectionHeader title="Your provider tools" />
            <Rows>
              {[
                ["Services offered", "What you do and typical prices"],
                ["Availability", "Hours and coverage area"],
                ["Incoming requests", "Requests Kurukoo routes to you"],
                ["Messages", "Customer conversations"],
                ["Reputation", "Ratings and reviews"],
                ["Followers and customers", "Who keeps coming back"],
                ["Analytics", "Views, replies, conversion"],
                ["Payouts and wallet", "How you get paid"],
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
              <Link to="/messages">
                <Action>Messages</Action>
              </Link>
              <Link to="/wallet">
                <Action>Wallet</Action>
              </Link>
            </div>
          </section>
        </div>
      )}

      <IntegrationGap>
        Provider onboarding, verification and payouts need the backend before they can be real.
      </IntegrationGap>
    </>
  );
}
