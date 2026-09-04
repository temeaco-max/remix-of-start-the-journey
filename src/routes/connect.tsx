import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Badge, Panel, SectionHeader } from "@/components/kurukoo/ui";
import { connections, type Connection } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect — Kurukoo" },
      {
        name: "description",
        content:
          "Connect storage, messaging, email and calendar so Kurukoo can act with your approval.",
      },
      { property: "og:title", content: "Connect — Kurukoo" },
      { property: "og:description", content: "The integration layer of Kurukoo." },
    ],
  }),
  component: ConnectPage,
});

const groups: { title: string; category: Connection["category"]; note: string }[] = [
  { title: "Storage", category: "storage", note: "Where your files and artifacts live." },
  { title: "Messaging", category: "messaging", note: "How Kurukoo reaches people." },
  { title: "Email", category: "email", note: "Sending and receiving on your behalf." },
  { title: "Calendar", category: "calendar", note: "Checking availability before booking." },
];

function ConnectionCard({ c }: { c: Connection }) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15.5px] font-medium">{c.name}</p>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">{c.description}</p>
        </div>
        <Badge tone={c.state === "connected" ? "success" : "quiet"}>
          {c.state === "connected"
            ? "Connected"
            : c.state === "available"
              ? "Not connected"
              : "Coming soon"}
        </Badge>
      </div>
      <p className="mt-2 text-[12.5px] text-muted-foreground">{c.permissions}</p>
      <div className="mt-3">
        {c.state === "connected" ? (
          <Action>Disconnect</Action>
        ) : c.state === "available" ? (
          <Action variant="primary">Connect</Action>
        ) : (
          <Action>Notify me</Action>
        )}
      </div>
    </Panel>
  );
}

function ConnectPage() {
  return (
    <>
      <PageHeader title="Connect" subtitle="Give Kurukoo the reach it needs — nothing more." />
      {groups.map((g) => (
        <section key={g.category} className="mt-6 first:mt-0">
          <SectionHeader title={g.title} subtitle={g.note} />
          <div className="grid gap-3 sm:grid-cols-2">
            {connections
              .filter((c) => c.category === g.category)
              .map((c) => (
                <ConnectionCard key={c.id} c={c} />
              ))}
          </div>
        </section>
      ))}
      <IntegrationGap>
        No integration is live. Connect buttons are visual contracts for the real OAuth flows.
      </IntegrationGap>
    </>
  );
}
