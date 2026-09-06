import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { PlanCard } from "@/components/kurukoo/cards";
import { Action } from "@/components/kurukoo/primitives";
import { Panel, Tabs } from "@/components/kurukoo/ui";
import { plans } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Kurukoo" },
      { name: "description", content: "Choose and manage Kurukoo plans for people, providers, businesses and creators." },
      { property: "og:title", content: "Subscriptions — Kurukoo" },
      { property: "og:description", content: "Manage access to Kurukoo and the plan that fits how you use it." },
    ],
  }),
  component: SubscriptionsPage,
});

const tabs = ["You", "Providers", "Businesses", "Creators"] as const;
function SubscriptionsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const audience = tab === "You" ? "user" : tab === "Providers" ? "provider" : tab === "Businesses" ? "business" : "creator";
  const selectedPlans = plans.filter((p) => p.audience === audience);
  return <>
    <PageHeader title="Subscriptions" subtitle="Choose the plan that fits how you use Kurukoo. Plans and transactions are kept separate so you always know what you are paying for." />
    <Tabs items={tabs} value={tab} onChange={setTab} />
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{selectedPlans.map((p) => <PlanCard key={p.id} plan={p} />)}</div>
    <Panel className="mt-6 p-4"><p className="text-[15px] font-medium">Your subscription</p><p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">Monthly renewal, plan changes, payment method and invoices will live here. Paid plan changes become available when billing is connected.</p><div className="mt-3 flex flex-wrap gap-2"><Action variant="primary">Choose plan</Action><Action>Change plan</Action><Action>Cancel subscription</Action></div></Panel>
    <section className="mt-8 grid gap-3 sm:grid-cols-3"><Panel className="p-4"><p className="text-[14px] font-medium">Access</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Your subscription covers access to Kurukoo and the features included in your plan.</p></Panel><Panel className="p-4"><p className="text-[14px] font-medium">Points</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Points support Kurukoo's coordination work and are separate from your subscription payment.</p></Panel><Panel className="p-4"><p className="text-[14px] font-medium">Services and purchases</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">A provider, business or other paid transaction is separate and visible before you approve it.</p></Panel></section>
    <p className="mt-6 text-[12.5px] text-muted-foreground">Billing and plan changes are coming soon. Your plan details remain visible so you can see what Kurukoo is designed to support.</p>
  </>;
}
