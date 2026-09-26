import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessagesSquare, Route as RouteIcon, ShieldCheck, Sparkles } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Kurukoo" },
      {
        name: "description",
        content:
          "What Kurukoo can do: converse, diagnose, discover, coordinate and remember — with your approval first.",
      },
    ],
  }),
  component: FeaturesPage,
});

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Start with the outcome",
    body: "Tell Kurukoo what you need, want, notice, or are worried about — in your own words, no category first. It works out what it can do and takes appropriate action.",
  },
  {
    icon: Sparkles,
    title: "Check, explain and diagnose",
    body: "When the available device, service or connected resource gives Kurukoo what it needs, it can check, explain, organise, diagnose and monitor — using only information and controls actually available to it.",
  },
  {
    icon: RouteIcon,
    title: "Coordinate people and services",
    body: "If Kurukoo cannot do it alone, it can help find who can. A request can move from direct assistance to another person, business, service or agent without making you repeat the whole story.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    body: "Important actions can require your permission. Kurukoo tells you what it knows and what it could not do — providers, payment, delivery and completion are only ever presented as completed with evidence.",
  },
];

function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section>
        <p className="text-[12px] font-medium text-muted-foreground">Features</p>
        <h1 className="mt-2 max-w-4xl font-serif text-[44px] leading-[1.01] tracking-[-0.05em] md:text-[62px]">
          Tell Kurukoo what you need. Let it help.
        </h1>
        <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
          Turn conversations into reminders, tasks, follow-ups and ongoing work without starting
          again. Keep useful preferences and context connected to your relationship when you
          choose — and see what happens from your point of view.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link to="/chat" className={actionClass()}>
            Try it in chat <ArrowRight className="size-4" />
          </Link>
          <Link to="/capabilities" className={actionClass()}>
            Browse capabilities
          </Link>
        </div>
      </section>
      <section className="mt-12 grid gap-3 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <Panel key={feature.title} className="p-5">
            <feature.icon className="size-5 text-primary" />
            <p className="mt-3 text-[14px] font-semibold">{feature.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-muted-foreground">{feature.body}</p>
          </Panel>
        ))}
      </section>
    </div>
  );
}
