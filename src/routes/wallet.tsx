import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CreditCard, Coins, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { TransactionRow } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, Rows, SectionHeader } from "@/components/kurukoo/ui";
import { transactions } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [
    { title: "Wallet and points — Kurukoo" },
    { name: "description", content: "Kurukoo points, money, top-ups and transaction history, kept separate." },
    { property: "og:title", content: "Wallet and points — Kurukoo" },
    { property: "og:description", content: "The value layer: points for work, money for payments." },
  ]}),
  component: WalletPage,
});

function Metric({ icon: Icon, label, value, note }: { icon: typeof Coins; label: string; value: string; note: string }) {
  return <Panel className="p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl bg-elevated text-muted-foreground"><Icon className="size-4" /></span><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Value</span></div><p className="mt-5 text-[11.5px] text-muted-foreground">{label}</p><p className="mt-1 text-[25px] font-semibold tracking-[-0.03em]">{value}</p><p className="mt-1 text-[11.5px] text-muted-foreground">{note}</p></Panel>;
}

function WalletPage() {
  return <>
    <PageHeader title="Wallet" subtitle="Points pay for coordination. Money pays providers." />

    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Coins} label="Kurukoo points" value="480 pts" note="Available for coordination" />
      <Metric icon={WalletCards} label="Wallet balance" value="£0.00" note="No payment method connected" />
      <Metric icon={CreditCard} label="Provider earnings" value="—" note="Provider accounts only" />
    </div>

    <Panel className="mt-4 overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[15px] font-medium">Ready for a request?</p><p className="mt-1 text-[13px] text-muted-foreground">Start with the action that needs value. Kurukoo keeps the payment decision attached to that request.</p></div>
        <div className="flex flex-wrap gap-2"><Action variant="primary">Top up points</Action><Action>Add payment method</Action><Link to="/subscriptions"><Action>Subscription</Action></Link></div>
      </div>
      <div className="grid border-t border-border sm:grid-cols-2">
        <div className="p-4 sm:border-r sm:border-border"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Points</p><p className="mt-2 text-[13.5px]">Used for Kurukoo's coordination work.</p></div>
        <div className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Money</p><p className="mt-2 text-[13.5px]">Moves only after you approve a provider or business payment.</p></div>
      </div>
    </Panel>

    <section className="mt-8">
      <SectionHeader title="History" subtitle="Points and money kept separate." />
      <Rows>{transactions.map((t) => <TransactionRow key={t.id} tx={t} />)}</Rows>
    </section>

    <div className="mt-4 flex justify-end"><Link to="/activity" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">See request activity <ArrowUpRight className="size-3.5" /></Link></div>
    <IntegrationGap>Balances, top-ups, refunds and payouts are illustrative — no payment provider is connected.</IntegrationGap>
  </>;
}
