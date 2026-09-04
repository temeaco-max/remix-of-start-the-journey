import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Kurukoo works — Kurukoo" },
      {
        name: "description",
        content:
          "Kurukoo turns a plain request into coordinated work: understanding, contacting people, checking with you, and reporting back.",
      },
      { property: "og:title", content: "How Kurukoo works — Kurukoo" },
      {
        property: "og:description",
        content: "Conversation, understanding, coordination, action, result, continuity.",
      },
    ],
  }),
  component: AboutPage,
});

const steps = [
  ["You say what you need", "Plain words. No forms, no categories to pick from."],
  ["Kurukoo works out the detail", "It asks only what it genuinely needs to know."],
  ["It does the running around", "Finding people, comparing options, arranging times."],
  ["It checks before committing", "Nothing is booked or paid for without your say-so."],
  ["It comes back with a result", "And the whole trail stays readable afterwards."],
];

function AboutPage() {
  return (
    <MarketingPage>
      <PageHeader
        title="How Kurukoo works"
        subtitle="One conversation, and everything else arranges itself around it."
      />
      <ol className="space-y-3">
        {steps.map(([title, body], i) => (
          <li key={title}>
            <Panel className="flex gap-4 p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-[13px] font-medium">
                {i + 1}
              </span>
              <div>
                <p className="text-[15px] font-medium">{title}</p>
                <p className="mt-0.5 text-[13.5px] text-muted-foreground">{body}</p>
              </div>
            </Panel>
          </li>
        ))}
      </ol>

      <section className="mt-10">
        <SectionHeader title="Try it" subtitle="The fastest way to understand it is to ask." />
        <Link to="/">
          <Action variant="primary">Start a conversation</Action>
        </Link>
      </section>
    </MarketingPage>
  );
}
