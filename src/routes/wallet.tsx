import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CreditCard, Coins, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { TransactionRow } from "@/components/kurukoo/cards";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { Panel, Rows, SectionHeader } from "@/components/kurukoo/ui";
import { transactions } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [
    { title: "Wallet and points — Kurukoo" },
    { name: "description", content: "See Kurukoo points, payments, provider earnings and transaction history in one place." },
    { property: "og:title", content: "Wallet and points — Kurukoo" },
    { property: "og:description", content: "Points support Kurukoo's coordination work. Money stays separate for approved services and purchases." },
  ]}),
  component: WalletPage,
});

function Metric({ icon: Icon, label, value, note }: { icon: typeof Coins; label: string; value: string; note: string }) {
  return <Panel className="p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl bg-elevated text-muted-foreground"><Icon className="size-4" /></span><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Balance</span></div><p className="mt-5 text-[11.5px] text-muted-foreground">{label}</p><p className="mt-1 text-[25px] font-semibold tracking-[-0.03em]">{value}</p><p className="mt-1 text-[11.5px] text-muted-foreground">{note}</p></Panel>;
}

function WalletPage() {
  return <>
    <PageHeader title="Wallet" subtitle="Points support Kurukoo's coordination work. Money stays separate for approved services and purchases." />
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Coins} label="Kurukoo points" value="480 pts" note="Available for coordination" />
      <Metric icon={WalletCards} label="Wallet balance" value="£0.00" note="Add a payment method when you are ready" />
      <Metric icon={CreditCard} label="Provider earnings" value="—" note="Available when provider payouts are connected" />
    </div>
    <Panel className="mt-4 overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[15px] font-medium">Choose what the value is for</p><p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Points can cover Kurukoo's coordination work. Provider and business payments remain separate and require your approval.</p></div>
        <div className="flex flex-wrap gap-2"><Action variant="primary">Top up points</Action><Action>Add payment method</Action><Link to="/subscriptions" className={actionClass()}>Subscription</Link></div>
      </div>
      <div className="grid border-t border-border sm:grid-cols-2">
        <div className="p-4 sm:border-r sm:border-border"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Points</p><p className="mt-2 text-[13.5px] leading-relaxed">Used for Kurukoo's coordination work, such as moving a request forward.</p></div>
        <div className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Money</p><p className="mt-2 text-[13.5px] leading-relaxed">Used for an approved provider, business or other paid transaction.</p></div>
      </div>
    </Panel>
    <section className="mt-8">
      <SectionHeader title="Transaction history" subtitle="Points and money remain clearly separated." />
      <Rows>{transactions.map((t) => <TransactionRow key={t.id} tx={t} />)}</Rows>
    </section>
    <section className="mt-8 grid gap-3 sm:grid-cols-2"><Panel className="p-4"><p className="text-[14px] font-medium">Top-ups and refunds</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Top up points, review refunds and keep a clear record of what happened to your balance.</p><p className="mt-3 text-[11.5px] text-muted-foreground">Coming soon</p></Panel><Panel className="p-4"><p className="text-[14px] font-medium">Provider payouts</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Providers can receive completed-work payouts here once payment connections are active.</p><p className="mt-3 text-[11.5px] text-muted-foreground">Coming soon</p></Panel></section>
    <div className="mt-4 flex justify-end"><Link to="/activity" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">See request activity <ArrowUpRight className="size-3.5" /></Link></div>
  </>;
}
