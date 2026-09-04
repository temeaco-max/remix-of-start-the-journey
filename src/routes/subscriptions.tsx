import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { PlanCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, Tabs } from "@/components/kurukoo/ui";
import { plans } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Kurukoo" },
      {
        name: "description",
        content: "Plans for people, providers, businesses and creators on Kurukoo.",
      },
      { property: "og:title", content: "Subscriptions — Kurukoo" },
      { property: "og:description", content: "Manage your Kurukoo plan and billing." },
    ],
  }),
  component: SubscriptionsPage,
});

const tabs = ["You", "Providers", "Businesses", "Creators"] as const;

function SubscriptionsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const audience =
    tab === "You"
      ? "user"
      : tab === "Providers"
        ? "provider"
        : tab === "Businesses"
          ? "business"
          : "creator";

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="One plan model, shared across the ecosystem." />
      <Tabs items={tabs} value={tab} onChange={setTab} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {plans
          .filter((p) => p.audience === audience)
          .map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
      </div>

      <Panel className="mt-6 p-4">
        <p className="text-[15px] font-medium">Billing</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Renews monthly. Payment status and invoices appear here once billing is connected.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Action variant="primary">Upgrade</Action>
          <Action>Downgrade</Action>
          <Action>Cancel</Action>
        </div>
      </Panel>

      <IntegrationGap>
        No billing provider is connected — plan changes do nothing yet.
      </IntegrationGap>
    </>
  );
}
