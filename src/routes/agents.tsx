import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { AgentCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { agents } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent network — Kurukoo" },
      { name: "description", content: "The specialised capabilities that carry out your requests, and when a human steps in." },
      { property: "og:title", content: "Agent network — Kurukoo" },
      { property: "og:description", content: "How Kurukoo coordinates work behind one conversation." },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  return (
    <>
      <PageHeader title="Agent network" subtitle="One conversation, several specialists behind it." />
      <div className="grid gap-3 sm:grid-cols-2">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <section className="mt-8">
        <SectionHeader title="How a request moves" subtitle="Orchestration you can follow." />
        <Panel className="p-4">
          <ol className="space-y-2 text-[14.5px] text-muted-foreground">
            <li>1 · You say what you need</li>
            <li>2 · Coordinator plans the work</li>
            <li>3 · Outreach and Scheduler contact people</li>
            <li>4 · Kurukoo returns options for your approval</li>
            <li>5 · A person steps in whenever judgement is needed</li>
          </ol>
          <div className="mt-4">
            <Link to="/work">
              <Action variant="primary">See it on your work</Action>
            </Link>
          </div>
        </Panel>
      </section>

      <IntegrationGap>
        Agent status is illustrative — no orchestration service is running yet.
      </IntegrationGap>
    </>
  );
}
