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
      { title: "Network — Kurukoo" },
      {
        name: "description",
        content: "People and organisations in the Kurukoo network who can help with real requests.",
      },
      { property: "og:title", content: "Network — Kurukoo" },
      {
        property: "og:description",
        content: "Find people with the capability to help, or offer your own.",
      },
    ],
  }),
  component: ProvidersPage,
});

const tabs = ["Find help", "Offer your capability"] as const;

function ProvidersPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const providers = entities.filter((e) => e.kind === "provider");

  return (
    <>
      <PageHeader title="Network" subtitle="People and organisations who can help with real requests." />
      <div className="mt-1 rounded-2xl border border-border bg-elevated/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        Kurukoo brings network members into the right request when their capability and availability are relevant. It does not promise availability until it is verified.
      </div>
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "Find help" ? (
        <div className="mt-4 grid gap-3">
          {providers.map((p) => (
            <EntityCard key={p.id} entity={p} />
          ))}
          <IntegrationGap>These are demonstration network members. Live availability requires the provider presence and verification services.</IntegrationGap>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15.5px] font-medium">Offer your capability</p>
              <Badge tone="quiet">Not verified</Badge>
            </div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Tell Kurukoo what you can do, where you work and when you can accept requests. Verification is required before customers can rely on your profile.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Action variant="primary">Start onboarding</Action>
              <Action>Verify identity</Action>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Open requests" value="0" note="Not connected" />
            <StatTile label="Active work" value="0" note="Not connected" />
            <StatTile label="Earnings" value="£0.00" note="No payouts connected" />
          </div>

          <section>
            <SectionHeader title="Your network tools" />
            <Rows>
              {[
                ["Capabilities", "What you can help with"],
                ["Availability", "When and where you can accept work"],
                ["Incoming requests", "Requests Kurukoo may bring to you"],
                ["Messages", "Conversations with people you help"],
                ["Trust & verification", "Identity and capability checks"],
                ["Customers", "People you've helped before"],
                ["Insights", "Views, replies and completed work"],
                ["Payments", "How completed work is paid"],
              ].map(([title, note]) => (
                <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block text-[15px]">{title}</span>
                    <span className="block text-[13px] text-muted-foreground">{note}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted-foreground">Not connected</span>
                </li>
              ))}
            </Rows>
            <div className="mt-3 flex gap-2">
              <Link to="/messages"><Action>Messages</Action></Link>
              <Link to="/wallet"><Action>Wallet</Action></Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
