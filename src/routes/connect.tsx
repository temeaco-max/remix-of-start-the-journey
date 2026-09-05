import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Cloud, Mail, MessageCircle, Plug, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Badge, Panel, SectionHeader } from "@/components/kurukoo/ui";
import { connections, type Connection } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect — Kurukoo" },
      { name: "description", content: "Connect storage, messaging, email and calendar so Kurukoo can act with your approval." },
      { property: "og:title", content: "Connect — Kurukoo" },
      { property: "og:description", content: "Choose what Kurukoo can reach." },
    ],
  }),
  component: ConnectPage,
});

const groups: { title: string; category: Connection["category"]; note: string; icon: typeof Cloud }[] = [
  { title: "Storage", category: "storage", note: "Files and artifacts Kurukoo may need to use.", icon: Cloud },
  { title: "Messaging", category: "messaging", note: "Ways Kurukoo can reach people after approval.", icon: MessageCircle },
  { title: "Email", category: "email", note: "Send and receive messages on your behalf.", icon: Mail },
  { title: "Calendar", category: "calendar", note: "Check availability before arranging time.", icon: CalendarDays },
];

function ConnectionCard({ c }: { c: Connection }) {
  const connected = c.state === "connected";
  const available = c.state === "available";
  return (
    <Panel className="group p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground"><Plug className="size-[18px]" /></span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-[15.5px] font-medium">{c.name}</p><Badge tone={connected ? "success" : "quiet"}>{connected ? "Connected" : available ? "Available" : "Coming soon"}</Badge></div><p className="mt-1 text-[13.5px] text-muted-foreground">{c.description}</p></div>
      </div>
      <div className="mt-3 rounded-xl bg-elevated/60 px-3 py-2.5"><p className="text-[12.5px] text-muted-foreground">Access</p><p className="mt-0.5 text-[13px]">{c.permissions}</p></div>
      <div className="mt-3 flex items-center justify-between gap-3"><p className="text-[12px] text-muted-foreground">{connected ? "You can disconnect at any time." : available ? "You approve the connection." : "Not available yet."}</p>{connected ? <Action>Disconnect</Action> : available ? <Action variant="primary">Connect</Action> : <Action>Notify me</Action>}</div>
    </Panel>
  );
}

function ConnectPage() {
  const connectedCount = connections.filter((c) => c.state === "connected").length;
  return (
    <>
      <PageHeader title="Connect" subtitle="Give Kurukoo the reach it needs — nothing more." />

      <Panel className="mb-7 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f4e6dc] text-foreground"><ShieldCheck className="size-5" /></span><div><p className="text-[16px] font-medium">You stay in control</p><p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">Connections only give Kurukoo access to the service. Actions such as sending, booking or paying still follow your approval rules.</p></div></div>
          <div className="shrink-0 text-sm"><span className="font-medium">{connectedCount}</span><span className="ml-1 text-muted-foreground">connected</span></div>
        </div>
      </Panel>

      {groups.map((g) => {
        const Icon = g.icon;
        return <section key={g.category} className="mt-7 first:mt-0"><SectionHeader title={g.title} subtitle={g.note} /><div className="grid gap-3 sm:grid-cols-2">{connections.filter((c) => c.category === g.category).map((c) => <ConnectionCard key={c.id} c={c} />)}</div><div className="mt-2 flex items-center gap-2 px-1 text-[11.5px] text-muted-foreground"><Icon className="size-3.5" />Choose access intentionally.</div></section>;
      })}

      <IntegrationGap>
        These services can't be connected yet. When they are, you'll always be asked to approve exactly what Kurukoo can access.
      </IntegrationGap>
    </>
  );
}
