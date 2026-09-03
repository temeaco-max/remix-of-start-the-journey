import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, Rows, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — Kurukoo" },
      { name: "description", content: "Getting started, chat, work, payments, providers, integrations and safety." },
      { property: "og:title", content: "Help — Kurukoo" },
      { property: "og:description", content: "Find an answer, or just ask Kurukoo." },
    ],
  }),
  component: HelpPage,
});

const sections = [
  ["Getting started", "What Kurukoo does and how to ask for things"],
  ["Chat", "Conversation, voice input and approvals"],
  ["Work", "Following a request from start to finish"],
  ["Account", "Profile, privacy and security"],
  ["Payments", "Points, money, refunds and subscriptions"],
  ["Providers and businesses", "Getting listed and receiving requests"],
  ["Integrations", "Storage, messaging, email and calendar"],
  ["Safety", "What Kurukoo will never do without approval"],
  ["Troubleshooting", "When something doesn't look right"],
];

function HelpPage() {
  const [q, setQ] = useState("");
  const { send } = useKurukoo();
  const list = sections.filter(([t, d]) => (t + d).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Help" subtitle="Answers, and a way straight back to the conversation." />
      <SearchField label="Search help" placeholder="Search help…" value={q} onChange={setQ} />

      <Panel className="mt-4 p-4">
        <p className="text-[15px] font-medium">Just ask Kurukoo</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Describe the problem in your own words and Kurukoo will take it from there.
        </p>
        <Link to="/" className="mt-3 inline-block">
          <Action variant="primary" onClick={() => send("I need help with Kurukoo.")}>
            Ask Kurukoo
          </Action>
        </Link>
      </Panel>

      <section className="mt-8">
        <SectionHeader title="Topics" subtitle={`${list.length} sections`} />
        <Rows>
          {list.map(([title, note]) => (
            <li key={title} className="px-4 py-3.5">
              <p className="text-[15px]">{title}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{note}</p>
            </li>
          ))}
        </Rows>
      </section>

      <section className="mt-8">
        <SectionHeader title="Still stuck?" />
        <Link to="/contact">
          <Action>Contact support</Action>
        </Link>
      </section>

      <IntegrationGap>Article content and support ticketing are not connected yet.</IntegrationGap>
    </>
  );
}
