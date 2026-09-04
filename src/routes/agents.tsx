import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { AgentCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { agents } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Capabilities — Kurukoo" },
      {
        name: "description",
        content: "See the kinds of things Kurukoo can help you accomplish through conversation.",
      },
      { property: "og:title", content: "Capabilities — Kurukoo" },
      {
        property: "og:description",
        content: "Useful capabilities that can help move your request forward.",
      },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  return (
    <>
      <PageHeader
        title="Capabilities"
        subtitle="Useful things Kurukoo can help you accomplish through one conversation."
      />
      <div className="mb-5 max-w-2xl rounded-2xl border border-border bg-elevated/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        You do not need to know which capability is involved. Just describe the outcome you want and Kurukoo will work out the next useful step.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <section className="mt-8">
        <SectionHeader title="What happens next" subtitle="You stay in control of the outcome." />
        <Panel className="p-4">
          <ol className="space-y-3 text-[14px]">
            {[
              ["Tell Kurukoo", "Describe what you need in your own words."],
              ["See useful options", "Kurukoo brings back relevant people, services or next steps when it can verify them."],
              ["Choose", "You decide which option to continue with."],
              ["Keep control", "Nothing is committed without your approval."],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-medium">{index + 1}</span>
                <span><span className="font-medium">{title}</span><span className="mt-0.5 block text-[13px] text-muted-foreground">{detail}</span></span>
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <Link to="/chat"><Action variant="primary">Start chatting</Action></Link>
          </div>
        </Panel>
      </section>

      <IntegrationGap>
        Some capability cards are illustrative until the corresponding Kurukoo services are connected. No unavailable capability is presented as a live guarantee.
      </IntegrationGap>
    </>
  );
}
