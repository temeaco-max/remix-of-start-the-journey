import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardCheck, LineChart, UserRound } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners — Kurukoo" },
      {
        name: "description",
        content:
          "Join a trusted network of experts helping organizations make better decisions and deliver meaningful outcomes.",
      },
    ],
  }),
  component: PartnersPage,
});

const STEPS = [
  {
    icon: UserRound,
    title: "Share what you genuinely provide",
    body: "Tell us about yourself so we can connect you with the right opportunities. Start with the work you can genuinely provide.",
  },
  {
    icon: BadgeCheck,
    title: "Strengthen with evidence",
    body: "Add experience or evidence to strengthen your profile. Opportunities, profile strength, evidence and earnings remain distinct states.",
  },
  {
    icon: ClipboardCheck,
    title: "Respond to briefs",
    body: "Review the brief and share your approach to the key questions. A transparent pipeline from invite to impact, with clear next actions.",
  },
  {
    icon: LineChart,
    title: "Track impact",
    body: "Track your impact, provide evidence and manage payment states. Completed, verified and paid are separate states — a proposal never becomes a promise.",
  },
];

function PartnersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section>
        <p className="text-[12px] font-medium text-muted-foreground">Partners</p>
        <h1 className="mt-2 max-w-4xl font-serif text-[44px] leading-[1.01] tracking-[-0.05em] md:text-[62px]">
          Expertise, matched with evidence.
        </h1>
        <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
          Join a trusted network of experts helping organizations make better decisions and
          deliver meaningful outcomes. Each role begins as a conversation and becomes a
          canonical partner profile only after review and authorization.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link to="/chat" search={{ query: "I want to join as a partner" } as never} className={actionClass()}>
            Become a partner <ArrowRight className="size-4" />
          </Link>
          <Link to="/network" className={actionClass()}>
            Explore the network
          </Link>
        </div>
      </section>
      <section className="mt-12 grid gap-3 md:grid-cols-2">
        {STEPS.map((step) => (
          <Panel key={step.title} className="p-5">
            <step.icon className="size-5 text-primary" />
            <p className="mt-3 text-[14px] font-semibold">{step.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-muted-foreground">{step.body}</p>
          </Panel>
        ))}
      </section>
      <Panel className="mt-6 border-dashed p-5">
        <p className="text-[13px] font-medium">Support organizations with decisions</p>
        <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground">
          Share knowledge and create impact across local support, onboarding and distribution —
          products and services represented with evidence, plus review, verification and
          specialist expertise. Authorization and the next supported action are always confirmed
          in the current partner flow.
        </p>
      </Panel>
    </div>
  );
}
