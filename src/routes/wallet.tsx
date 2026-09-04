import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { TransactionRow } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, Rows, SectionHeader, StatTile } from "@/components/kurukoo/ui";
import { transactions } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet and points — Kurukoo" },
      {
        name: "description",
        content: "Kurukoo points, money, top-ups and transaction history, kept separate.",
      },
      { property: "og:title", content: "Wallet and points — Kurukoo" },
      {
        property: "og:description",
        content: "The value layer: points for work, money for payments.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <>
      <PageHeader title="Wallet" subtitle="Points pay for coordination. Money pays providers." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Kurukoo points" value="480 pts" note="Prototype balance" />
        <StatTile label="Wallet balance" value="£0.00" note="No payment method" />
        <StatTile label="Provider earnings" value="—" note="Provider accounts only" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Action variant="primary">Top up points</Action>
        <Action>Add payment method</Action>
        <Link to="/subscriptions">
          <Action>Subscription</Action>
        </Link>
      </div>

      <Panel className="mt-6 p-4">
        <p className="text-[15px] font-medium">Points and money are not the same</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Points cover Kurukoo doing the running around. Money only moves when you approve a payment
          to a provider or business.
        </p>
      </Panel>

      <section className="mt-8">
        <SectionHeader title="History" subtitle="Points and money kept separate." />
        <Rows>
          {transactions.map((t) => (
            <TransactionRow key={t.id} tx={t} />
          ))}
        </Rows>
      </section>

      <IntegrationGap>
        Balances, top-ups, refunds and payouts are illustrative — no payment provider is connected.
      </IntegrationGap>
    </>
  );
}
