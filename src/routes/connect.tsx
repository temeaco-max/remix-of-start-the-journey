import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Cloud,
  Mail,
  MessageCircle,
  Mic,
  Plug,
  ShieldCheck,
} from "lucide-react";
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
          "Connect assistants and services so Kurukoo can receive requests and act with your approval.",
      },
      { property: "og:title", content: "Connect — Kurukoo" },
      {
        property: "og:description",
        content: "Choose which assistants and services can reach Kurukoo.",
      },
    ],
  }),
  component: ConnectPage,
});

const groups: {
  title: string;
  category: Connection["category"];
  note: string;
  icon: typeof Cloud;
}[] = [
  {
    title: "Storage",
    category: "storage",
    note: "Files and artifacts Kurukoo may need to use.",
    icon: Cloud,
  },
  {
    title: "Messaging",
    category: "messaging",
    note: "Ways Kurukoo can reach people after approval.",
    icon: MessageCircle,
  },
  {
    title: "Email",
    category: "email",
    note: "Send and receive messages on your behalf.",
    icon: Mail,
  },
  {
    title: "Calendar",
    category: "calendar",
    note: "Check availability before arranging time.",
    icon: CalendarDays,
  },
];

type AssistantConnection = {
  id: string;
  name: string;
  mark: string;
  description: string;
  access: string;
};

const assistants: AssistantConnection[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    mark: "C",
    description: "Use your ChatGPT conversations or voice sessions as a way to talk to Kurukoo.",
    access:
      "Read only Kurukoo information you explicitly allow; submit actions through Kurukoo's approval rules.",
  },
  {
    id: "claude",
    name: "Claude",
    mark: "C",
    description: "Bring Claude into the same conversation-to-action loop with Kurukoo.",
    access:
      "Scoped access to permitted Kurukoo context; no unrestricted account or conversation access.",
  },
  {
    id: "grok",
    name: "Grok",
    mark: "G",
    description: "Use Grok chat or voice to ask Kurukoo to carry out useful next steps.",
    access:
      "Read permitted Kurukoo context and request actions; commitments remain subject to approval.",
  },
  {
    id: "gemini",
    name: "Gemini",
    mark: "G",
    description:
      "Talk to Kurukoo through Gemini chat or voice when that is the most convenient surface.",
    access:
      "Only the Kurukoo information and action scope you authorize is available to the bridge.",
  },
];

function AssistantCard({
  assistant,
  connected,
  onConnect,
}: {
  assistant: AssistantConnection;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <Panel className="group p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-elevated text-[16px] font-semibold text-foreground">
          {assistant.mark}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-medium">{assistant.name}</p>
            <Badge tone={connected ? "success" : "quiet"}>
              {connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
            {assistant.description}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground">
          <MessageCircle className="size-3.5" />
          Chat
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground">
          <Mic className="size-3.5" />
          Voice
        </span>
      </div>
      <div className="mt-3 rounded-xl bg-elevated/60 px-3 py-2.5">
        <p className="text-[12px] font-medium">Permission scope</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {assistant.access}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground">
          {connected ? "Access can be revoked." : "Authorization is user-controlled."}
        </p>
        <Action variant={connected ? "quiet" : "primary"} onClick={onConnect}>
          {connected ? "Disconnect" : "Connect"}
        </Action>
      </div>
    </Panel>
  );
}

function ConnectionCard({ c }: { c: Connection }) {
  const connected = c.state === "connected";
  const available = c.state === "available";
  return (
    <Panel className="group p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground">
          <Plug className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15.5px] font-medium">{c.name}</p>
            <Badge tone={connected ? "success" : "quiet"}>
              {connected ? "Connected" : available ? "Available" : "Coming soon"}
            </Badge>
          </div>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{c.description}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-elevated/60 px-3 py-2.5">
        <p className="text-[12.5px] text-muted-foreground">Access</p>
        <p className="mt-0.5 text-[13px]">{c.permissions}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {connected
            ? "You can disconnect at any time."
            : available
              ? "You approve the connection."
              : "Not available yet."}
        </p>
        {connected ? (
          <Action>Disconnect</Action>
        ) : available ? (
          <Action variant="primary">Connect</Action>
        ) : (
          <Action>Notify me</Action>
        )}
      </div>
    </Panel>
  );
}

function ConnectPage() {
  const [connectedAssistants, setConnectedAssistants] = useState<string[]>([]);
  const connectedCount =
    connections.filter((c) => c.state === "connected").length + connectedAssistants.length;

  const toggleAssistant = (id: string) => {
    setConnectedAssistants((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <>
      <PageHeader
        title="Connect"
        subtitle="Bring the conversations you already use into Kurukoo — with clear boundaries around access and action."
      />

      <Panel className="mb-7 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-tint text-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-[16px] font-medium">You stay in control</p>
              <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                A connected assistant can be a voice or chat doorway into Kurukoo. It should only
                receive Kurukoo information you allow, and requests that perform external actions
                still pass through Kurukoo's permission and approval rules.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-sm">
            <span className="font-medium">{connectedCount}</span>
            <span className="ml-1 text-muted-foreground">connected</span>
          </div>
        </div>
      </Panel>

      <section>
        <SectionHeader
          title="AI assistants"
          subtitle="Talk to Kurukoo from ChatGPT, Claude, Grok or Gemini, using chat or voice."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {assistants.map((assistant) => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              connected={connectedAssistants.includes(assistant.id)}
              onConnect={() => toggleAssistant(assistant.id)}
            />
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 size-3.5 shrink-0" />
          Prototype state only: the cards establish the intended OAuth/bridge contract; no external
          assistant connection is activated by this UI yet.
        </div>
      </section>

      {groups.map((g) => {
        const Icon = g.icon;
        return (
          <section key={g.category} className="mt-8">
            <SectionHeader title={g.title} subtitle={g.note} />
            <div className="grid gap-3 sm:grid-cols-2">
              {connections
                .filter((c) => c.category === g.category)
                .map((c) => (
                  <ConnectionCard key={c.id} c={c} />
                ))}
            </div>
            <div className="mt-2 flex items-center gap-2 px-1 text-[11.5px] text-muted-foreground">
              <Icon className="size-3.5" />
              Choose access intentionally.
            </div>
          </section>
        );
      })}

      <IntegrationGap>
        External integrations are not live in this prototype. The assistant cards define the
        intended bridge: assistant chat/voice → Kurukoo identity and permitted context → Kurukoo
        action/approval → result back to the assistant.
      </IntegrationGap>
    </>
  );
}
