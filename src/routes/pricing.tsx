import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { PlanCard } from "@/components/kurukoo/cards";
import { SectionHeader } from "@/components/kurukoo/ui";
import { plans } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Kurukoo" },
      {
        name: "description",
        content: "Plans for people, providers, businesses and creators, plus how Kurukoo points work.",
      },
      { property: "og:title", content: "Pricing — Kurukoo" },
      { property: "og:description", content: "Simple plans, and points for the work itself." },
    ],
  }),
  component: PricingPage,
});

const groups = [
  ["For people", "user"],
  ["For providers", "provider"],
  ["For businesses", "business"],
  ["For creators", "creator"],
] as const;

function PricingPage() {
  return (
    <MarketingPage>
      <PageHeader
        title="Pricing"
        subtitle="A plan for the app, and points for the work Kurukoo does."
      />

      {groups.map(([label, audience]) => {
        const list = plans.filter((p) => p.audience === audience);
        if (list.length === 0) return null;
        return (
          <section key={audience} className="mt-8 first:mt-0">
            <SectionHeader title={label} />
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-10">
        <SectionHeader
          title="Points and money are separate"
          subtitle="Your plan covers the app. Points cover coordination and any paid service is charged separately."
        />
        <div className="flex flex-wrap gap-2">
          <Link to="/wallet">
            <Action variant="primary">See wallet and points</Action>
          </Link>
          <Link to="/subscriptions">
            <Action>Manage subscription</Action>
          </Link>
        </div>
      </section>

      <IntegrationGap>Billing and payment processing are not connected yet.</IntegrationGap>
    </MarketingPage>
  );
}
