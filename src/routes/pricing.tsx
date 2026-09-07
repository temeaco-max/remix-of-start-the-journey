import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { PlanCard } from "@/components/kurukoo/cards";
import { SectionHeader } from "@/components/kurukoo/ui";
import { plans } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
    { title: "Pricing — Kurukoo" },
    { name: "description", content: "Plans for people, providers, businesses and creators, plus how points, payments, advertising and partner value fit together." },
    { property: "og:title", content: "Pricing — Kurukoo" },
    { property: "og:description", content: "See how Kurukoo plans, points and commercial services fit together." },
  ] }),
  component: PricingPage,
});

const groups = [["For people", "user"], ["For providers", "provider"], ["For businesses", "business"], ["For creators", "creator"]] as const;
const valuePaths = [
  ["Plans", "Free and paid access for people, with dedicated plans for providers, businesses and creators.", "/subscriptions", "Manage subscriptions"],
  ["Points", "Points support Kurukoo's coordination work and stay separate from cash payments.", "/wallet", "See points and wallet"],
  ["Provider and business payments", "Money is used for an approved service or purchase and remains visible as a separate transaction.", "/wallet", "Open payment layer"],
  ["Advertising", "Businesses can sponsor clearly labelled placements across relevant discovery moments and measure performance.", "/advertising", "Explore advertising"],
  ["Creator revenue", "Creators can build channels, subscriptions and revenue-share opportunities around useful content.", "/creators", "Explore creators"],
  ["Partner, referral and affiliate value", "Useful referrals, partner relationships and affiliate discovery can create value without taking control away from the user.", "/partners", "Explore partners"],
  ["Marketplace fees", "Service and product transactions can support platform and processing fees while the price remains visible before approval.", "/providers", "See provider network"],
] as const;

function PricingPage() {
  return <MarketingPage>
    <PageHeader title="Pricing" subtitle="Plans give you access. Points support Kurukoo's coordination work. Payments cover approved services and purchases." />
    {groups.map(([label, audience]) => { const list = plans.filter((p) => p.audience === audience); return list.length ? <section key={audience} className="mt-8 first:mt-0"><SectionHeader title={label} /><div className="grid gap-3 sm:grid-cols-2">{list.map((p) => <PlanCard key={p.id} plan={p} />)}</div></section> : null; })}
    <section className="mt-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">How value moves</p>
      <h2 className="mt-1 text-[24px] font-semibold tracking-tight">One experience, several ways to pay, earn or grow.</h2>
      <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">Kurukoo keeps access, coordination work, transactions, advertising and partner value distinct so the reason for each charge or payment stays clear.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{valuePaths.map(([title, body, to, cta]) => <div key={title} className="rounded-2xl border border-border bg-surface p-4"><p className="text-[14px] font-semibold">{title}</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p><Link to={to as never} className="mt-3 inline-flex text-[11.5px] font-medium hover:underline">{cta} →</Link></div>)}</div>
    </section>
    <section className="mt-10"><SectionHeader title="Points and money stay separate" subtitle="Your plan covers access to Kurukoo. Points cover Kurukoo's coordination work. A provider or business payment remains a separate, visible transaction." /><div className="flex flex-wrap gap-2"><Link to="/wallet" className={actionClass("primary")}>Open wallet and points</Link><Link to="/subscriptions" className={actionClass()}>Manage subscription</Link></div></section>
    <p className="mt-8 rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">Payments, refunds, payouts and live billing become active when the payment connection is enabled.</p>
  </MarketingPage>;
}
