import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Car,
  Check,
  Compass,
  Coffee,
  Globe2,
  Heart,
  Lock,
  MessageCircle,
  Network,
  ShoppingBag,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Store,
  Sun,
  Target,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { integrations } from "@/lib/integration-catalog";
import { getLocale, type KurukooLocale } from "@/lib/kurukoo-locale";

const prompts: Record<KurukooLocale, readonly string[]> = {
  gb: [
    "Find someone to fix my boiler",
    "Help me plan my day",
    "Find somewhere good for dinner",
    "Get me a ride",
    "Remind me about bin day",
    "Help me get this done",
  ],
  ng: [
    "Find someone to fix my phone",
    "Help me plan my day",
    "Find somewhere good for dinner",
    "Get me a ride",
    "Remind me about something",
    "Help me get this done",
  ],
};
const examples: Record<KurukooLocale, readonly (readonly string[])[]> = {
  gb: [
    [
      "Find a reliable plumber tomorrow",
      "Work through the requirement, timing and postcode before anything consequential happens.",
    ],
    [
      "Prepare me for my client call",
      "Bring together useful context, structure the work and keep the result with you.",
    ],
    [
      "When is my MOT due?",
      "Track dates that matter and get reminded before they arrive.",
    ],
  ],
  ng: [
    [
      "Find a reliable electrician tomorrow",
      "Work through the requirement, timing and route before anything consequential happens.",
    ],
    [
      "Prepare me for my client call",
      "Bring together useful context, structure the work and keep the result with you.",
    ],
    [
      "Find somewhere good for dinner nearby",
      "Start with the outcome and narrow the choice with useful context.",
    ],
  ],
};
const capabilities = [
  [MessageCircle, "Ask", "Start naturally. No category, form or workflow to learn."],
  [Target, "Get things done", "Turn a request into real work and keep it moving."],
  [Network, "Find", "Use people, places, services, tools and opportunities in context."],
  [ShieldCheck, "Stay in control", "See what will happen and approve consequential actions."],
  [Heart, "Remember", "Keep useful context so future conversations can start further ahead."],
  [Zap, "Notice", "Get useful proactive help when there is a genuine reason to interrupt you."],
] as const;

const processSteps = [
  [MessageCircle, "Start anywhere", "Say what you need in plain language — a question, a task, or a goal."],
  [Compass, "Kurukoo makes sense of it", "Context, location, timing, people and tools come together in one working thread."],
  [Workflow, "The work moves", "Kurukoo finds a useful route, coordinates the next steps, and keeps you updated."],
  [ShieldCheck, "You stay in control", "You see consequential actions before they happen, with evidence attached to the outcome."],
] as const;

const featuredIntegrations = integrations
  .filter((integration) => integration.status === "available" || integration.status === "native")
  .slice(0, 10);

const dayMoments: Record<
  KurukooLocale,
  readonly { time: string; Icon: typeof Sun; title: string; subtitle: string; prompt: string }[]
> = {
  gb: [
    {
      time: "06:30",
      Icon: Sun,
      title: "Wake up",
      subtitle: "Need a lift this morning?",
      prompt: "Get me a ride to the station",
    },
    {
      time: "09:00",
      Icon: ShoppingBag,
      title: "Morning errand",
      subtitle: "Pick up a prescription on the way to work.",
      prompt: "Find someone to pick up a prescription",
    },
    {
      time: "12:00",
      Icon: Coffee,
      title: "Lunch break",
      subtitle: "Looking for lunch? Tell me what you'd like to order.",
      prompt: "Find somewhere good for lunch nearby",
    },
    {
      time: "14:00",
      Icon: Wrench,
      title: "Get it fixed",
      subtitle: "Describe the repair and your postcode.",
      prompt: "Find someone to fix my boiler",
    },
    {
      time: "16:00",
      Icon: Store,
      title: "Hustle time",
      subtitle: "Want to offer a skill? Tell me what work you do.",
      prompt: "I can assemble flatpack this week",
    },
    {
      time: "18:00",
      Icon: Car,
      title: "Send it",
      subtitle: "Share pickup and delivery postcodes to coordinate a parcel.",
      prompt: "Help me send a package to my client",
    },
  ],
  ng: [
    {
      time: "06:30",
      Icon: Sun,
      title: "Wake up",
      subtitle: "Need a lift this morning?",
      prompt: "Get me a ride to the airport",
    },
    {
      time: "09:00",
      Icon: ShoppingBag,
      title: "Morning errand",
      subtitle: "Pick up a prescription on the way to work.",
      prompt: "Find someone to pick up a prescription",
    },
    {
      time: "12:00",
      Icon: Coffee,
      title: "Lunch break",
      subtitle: "Looking for lunch? Tell me what you'd like to order.",
      prompt: "Find somewhere good for lunch nearby",
    },
    {
      time: "14:00",
      Icon: Wrench,
      title: "Get it fixed",
      subtitle: "Describe the repair and your area.",
      prompt: "Find someone to fix my phone",
    },
    {
      time: "16:00",
      Icon: Store,
      title: "Hustle time",
      subtitle: "Want to offer a skill? Tell me what work you do.",
      prompt: "I can repair iPhones this week",
    },
    {
      time: "18:00",
      Icon: Car,
      title: "Send it",
      subtitle: "Share pickup and delivery areas to coordinate a parcel.",
      prompt: "Help me send a package to my client",
    },
  ],
};

export function PublicHome({ onSend }: { onSend?: (message: string) => void }) {
  const locale = getLocale();
  const localePrompts = prompts[locale];
  const localeExamples = examples[locale];
  const localeMoments = dayMoments[locale];
  const [promptIndex, setPromptIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setPromptIndex((value) => (value + 1) % localePrompts.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(
      () => setDayIndex((value) => (value + 1) % localeMoments.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const sendPrompt = (prompt: string) => {
    onSend?.(prompt);
    window.location.href = "/chat";
  };
  const shuffle = () =>
    setPromptIndex(
      (value) => (value + 1 + Math.floor(Math.random() * (localePrompts.length - 1))) % localePrompts.length,
    );

  return (
    <div className="w-full pb-12">
      <section
        id="public-home-hero"
        className="relative min-h-[calc(100vh-120px)] overflow-hidden border-b border-border/80 py-8 md:py-12"
      >
        <div className="pointer-events-none absolute right-[-12%] top-[-18%] size-[520px] rounded-full bg-brand-tint/25 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[18%] size-[300px] rounded-full bg-primary/5 blur-[90px]" />
        <div className="relative grid min-h-[70vh] items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Kurukoo AI
            </div>
            <h1 className="max-w-4xl font-serif text-[52px] leading-[.92] tracking-[-0.065em] md:text-[78px] lg:text-[92px]">
              The intelligence layer
              <br />
              <span className="text-muted-foreground/70">for everyday life.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
              Say what you need. Kurukoo understands the context, finds a useful route, coordinates the work, and stays with you until there is a real outcome.
            </p>
            <div className="mt-7 max-w-3xl">
              <Composer
                onSend={onSend ?? (() => undefined)}
                voiceOverlayTargetId="public-home-hero"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
                <div className="flex min-w-max gap-2">
                  {Array.from({ length: 4 }, (_, offset) => {
                    const prompt = localePrompts[(promptIndex + offset) % localePrompts.length];
                    return (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendPrompt(prompt)}
                        className="shrink-0 border border-border/80 bg-background/70 px-3 py-2 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={shuffle}
                aria-label="Shuffle prompts"
                className="grid size-9 shrink-0 place-items-center border border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <Shuffle className="size-3.5" />
              </button>
            </div>
          </div>
          <aside className="hidden border-l border-border/80 pl-7 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              From intent to outcome
            </p>
            <p className="mt-4 font-serif text-[27px] leading-[1.05] tracking-[-0.035em]">
              One place to
              <br />
              move life forward.
            </p>
            <div className="mt-8 space-y-4 text-[11.5px] leading-5 text-muted-foreground">
              <p>
                <span className="text-foreground">Understand.</span> Conversation, memory and context in one thread.
              </p>
              <p>
                <span className="text-foreground">Coordinate.</span> People, places, tools and services that can help.
              </p>
              <p>
                <span className="text-foreground">Stay in control.</span> Kurukoo asks before consequential actions.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Why it feels different
            </p>
            <h2 className="mt-3 max-w-md font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
              One relationship.
              <br />
              Many things done.
            </h2>
          </div>
          <div className="grid gap-px border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([Icon, title, detail]) => {
              const C = Icon as typeof Sparkles;
              return (
                <div
                  key={title as string}
                  className="group min-h-[155px] bg-background p-5 transition-colors hover:bg-surface"
                >
                  <C
                    className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                    strokeWidth={1.7}
                  />
                  <p className="mt-9 text-[13px] font-semibold">{title as string}</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                    {detail as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="process-title">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              How Kurukoo turns intent into progress
            </p>
            <h2 id="process-title" className="mt-3 max-w-md font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[50px]">
              One conversation.
              <br />
              Real movement.
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">
              Kurukoo is the connective layer between what you mean and what needs to happen next — across your digital life and the real world around you.
            </p>
            <Link to="/how-it-works" className="mt-6 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80">
              See how it works <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="border-t border-border/80">
            {processSteps.map(([Icon, title, detail], index) => (
              <div key={title} className="grid gap-4 border-b border-border/80 py-5 sm:grid-cols-[34px_190px_minmax(0,1fr)] sm:items-start">
                <span className="text-[10px] tabular-nums text-muted-foreground">0{index + 1}</span>
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" strokeWidth={1.7} />
                  <p className="text-[13px] font-semibold">{title}</p>
                </div>
                <p className="text-[11.5px] leading-5 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border/80 py-14 md:py-20" aria-labelledby="integrations-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">All your context, in one place</p>
            <h2 id="integrations-title" className="mt-3 font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[50px]">
              Bring the tools you already use.
            </h2>
            <p className="mt-4 text-[14px] leading-6 text-muted-foreground">
              Connect sources, channels, knowledge and devices without losing the thread. Every doorway stays scoped, visible and owner-controlled.
            </p>
          </div>
          <Link to="/integrations" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80">
            Explore integrations <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="relative mt-10 overflow-hidden border-y border-border/80 py-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
          <div className="flex min-w-max animate-[marquee_28s_linear_infinite] gap-3 pr-3 motion-reduce:animate-none">
            {[...featuredIntegrations, ...featuredIntegrations].map((integration, index) => {
              const Icon = integration.icon;
              return (
                <Link key={`${integration.slug}-${index}`} to="/integrations" className="flex min-w-[170px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-elevated">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><Icon className="size-4" /></span>
                  <span className="grid gap-0.5"><strong className="text-[11px] font-semibold">{integration.name}</strong><small className="text-[9.5px] text-muted-foreground">{integration.category}</small></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="scale-title">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">What you get</p>
            <h2 id="scale-title" className="mt-3 max-w-md font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[50px]">
              A calmer operating system for real life.
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">
              Useful for the small things, dependable when the work gets real, and designed to grow with the context you choose to share.
            </p>
          </div>
          <div className="grid gap-px border border-border/80 bg-border/80 sm:grid-cols-3">
            {[
              [Globe2, "Everyday help", "From a ride or repair to planning, research and reminders."],
              [Network, "One connected thread", "People, places, tools and outcomes stay related."],
              [Check, "Visible control", "Approvals, boundaries and evidence are part of the flow."],
            ].map(([Icon, title, detail]) => (
              <div key={title as string} className="min-h-[190px] bg-background p-5 transition-colors hover:bg-surface">
                <Icon className="size-5 text-primary" strokeWidth={1.7} />
                <p className="mt-12 text-[13px] font-semibold">{title as string}</p>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{detail as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-b border-border/80 py-14 md:py-20"
        aria-labelledby="examples-title"
      >
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Real life
            </p>
            <h2
              id="examples-title"
              className="mt-3 font-serif text-[34px] leading-none tracking-[-0.045em] md:text-[44px]"
            >
              Start with the outcome.
            </h2>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() =>
                setExampleIndex((value) => (value + localeExamples.length - 1) % localeExamples.length)
              }
              aria-label="Previous example"
              className="grid size-9 place-items-center border border-border text-muted-foreground hover:text-foreground"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setExampleIndex((value) => (value + 1) % localeExamples.length)}
              aria-label="Next example"
              className="grid size-9 place-items-center border border-border text-muted-foreground hover:text-foreground"
            >
              →
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-px border border-border/80 bg-border/80 md:grid-cols-3">
          {localeExamples.map(([ask, answer], index) => (
            <Link
              key={ask}
              to="/chat"
              className={`group min-h-[245px] bg-background p-6 transition-colors hover:bg-surface ${index === exampleIndex ? "ring-1 ring-inset ring-foreground/10" : ""}`}
            >
              <span className="text-[10px] tabular-nums text-muted-foreground">0{index + 1}</span>
              <p className="mt-12 max-w-sm text-[17px] font-medium leading-[1.25] tracking-[-0.02em]">
                “{ask}”
              </p>
              <p className="mt-4 max-w-sm text-[11.5px] leading-5 text-muted-foreground">
                {answer}
              </p>
              <span className="mt-7 inline-flex items-center gap-1 text-[10.5px] font-medium">
                Try it{" "}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              How Kurukoo moves
            </p>
            <h2 className="mt-3 max-w-md font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
              Conversation → action → outcome.
            </h2>
          </div>
          <div className="border-t border-border/80">
            {[
              [
                MessageCircle,
                "Tell it what you need",
                "Start in plain language. Kurukoo works with the context you give it.",
              ],
              [
                Compass,
                "Find a useful route",
                "Discover the people, places, tools or information that can move the request forward.",
              ],
              [
                ShieldCheck,
                "Approve when it matters",
                "You see consequential actions before Kurukoo takes them.",
              ],
              [Sparkles, "See what happened", "Work, evidence and outcomes stay connected."],
            ].map(([Icon, title, detail], index) => {
              const C = Icon as typeof Sparkles;
              return (
                <div
                  key={title as string}
                  className="grid gap-4 border-b border-border/80 py-5 sm:grid-cols-[32px_170px_minmax(0,1fr)] sm:items-start"
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <C className="size-4 text-muted-foreground" />
                    <p className="text-[13px] font-semibold">{title as string}</p>
                  </div>
                  <p className="text-[11.5px] leading-5 text-muted-foreground">
                    {detail as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20">
        <div className="mx-auto w-full max-w-[1160px] px-5 md:px-9">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                An illustrative day
              </p>
              <h2 className="mt-3 font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
                From morning move to evening chop.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
                One conversation can coordinate the day without asking you to juggle apps.
              </p>
            </div>
            <div className="lg:justify-end">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {localeMoments[dayIndex].time}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDayIndex((value) => (value + localeMoments.length - 1) % localeMoments.length)
                    }
                    aria-label="Previous day moment"
                    className="grid size-8 place-items-center border border-border text-muted-foreground hover:text-foreground"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayIndex((value) => (value + 1) % localeMoments.length)}
                    aria-label="Next day moment"
                    className="grid size-8 place-items-center border border-border text-muted-foreground hover:text-foreground"
                  >
                    →
                  </button>
                </div>
              </div>
              <div
                key={dayIndex}
                className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated">
                    {(() => {
                      const Icon = localeMoments[dayIndex].Icon as typeof Sparkles;
                      return <Icon className="size-5 text-primary" />;
                    })()}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[17px] font-semibold">{localeMoments[dayIndex].title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {localeMoments[dayIndex].subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => sendPrompt(localeMoments[dayIndex].prompt)}
                  className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80"
                >
                  Try in Chat <ArrowRight className="size-3" />
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-1.5">
                {localeMoments.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setDayIndex(index)}
                    aria-label={`Go to day moment ${index + 1}`}
                    className={`h-1.5 w-1.5 rounded-full ${index === dayIndex ? "bg-primary" : "bg-border"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="relative overflow-hidden bg-foreground px-6 py-12 text-background md:px-10 md:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-background/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-background/55">
                Kurukoo
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-[38px] leading-[.98] tracking-[-0.05em] md:text-[56px]">
                Your everyday AI
                <br />
                that gets things done.
              </h2>
              <p className="mt-5 max-w-xl text-[13px] leading-6 text-background/65">
                Bring one thing. Then another. Kurukoo is designed to stay useful as the work gets
                real.
              </p>
            </div>
            <Link
              to="/chat"
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-background px-5 text-[11px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
            >
              Start with Kurukoo <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto w-full max-w-[1160px] px-5 md:px-9">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Privacy & safety
              </p>
              <h2 className="mt-4 font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
                Your data, approvals, and evidence stay yours.
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
                Kurukoo never asks for your passwords. When an action requires your approval — a
                purchase, a booking, an email — you see the details before anything happens.
                Conversations, work history, and outcomes stay connected so nothing is lost.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/legal/$section"
                  params={{ section: "privacy" }}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:opacity-70"
                >
                  Read the privacy policy <ArrowRight className="size-3" />
                </Link>
                <Link
                  to="/legal/$section"
                  params={{ section: "safety" }}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:opacity-70"
                >
                  Trust & safety <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:justify-end">
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <ShieldCheck className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">You approve first</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Consequential actions need your sign-off.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <Lock className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">Data stays private</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Conversations and memory are never sold.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <Network className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">Evidence preserved</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Every step is connected and auditable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20">
        <div className="mx-auto w-full max-w-[1160px] px-5 md:px-9">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Connections
              </p>
              <h2 className="mt-3 font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
                Connect what matters.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
                Connect your tools, sources and channels. Every connection is scoped and
                owner-controlled — configuration alone never means a live provider.
              </p>
              <Link
                to="/integrations"
                className="mt-6 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80"
              >
                Browse integrations <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:justify-end">
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <MessageCircle className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">Built in</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Web Chat, Voice, Presence</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <Compass className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">Sources</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Drive, Notion, Outlook, OneDrive
                </p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border/60 bg-surface p-4 text-center">
                <Network className="size-6 text-primary" />
                <p className="mt-2 text-[11px] font-semibold">Channels</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  WhatsApp, Telegram, SMS, Email
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LocalSpotlight />
    </div>
  );
}

const SPOTLIGHT_FALLBACK: Record<
  KurukooLocale,
  { eyebrow: string; title: string; body: string; items: string[]; cta: string; prompt: string }
> = {
  gb: {
    eyebrow: "United Kingdom",
    title: "Everyday help, UK-wide.",
    body: "Tell Kurukoo what needs doing in your own words — a boiler repair in Manchester, an MOT reminder, garden clearance before the weekend. You will always see what is known before anything consequential happens.",
    items: [
      "Boiler, plumbing & electrical repairs by postcode",
      "MOT, driving lessons & theory test prep",
      "Bin days, council tax & local services",
      "Cleaning, gardening, removals & flatpack",
    ],
    cta: "Start with your postcode",
    prompt: "I need help at home",
  },
  ng: {
    eyebrow: "Nigeria",
    title: "Everyday help, wherever you are.",
    body: "Tell Kurukoo what needs doing in your own words — phone repairs in Ikeja, a ride to the airport, dinner nearby. You will always see what is known before anything consequential happens.",
    items: [
      "Phone, electrical & appliance repairs by area",
      "Rides, dispatch & errands",
      "Food, groceries & home cooking",
      "Tailoring, cleaning & home services",
    ],
    cta: "Start with your area",
    prompt: "I need help around me",
  },
};

function LocalSpotlight() {
  const locale = getLocale();
  const [cms, setCms] = useState<{ title?: string; body?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const base = (import.meta.env["VITE_KURUKOO_API_BASE_URL"] ?? "").replace(/\/$/, "");
    fetch(`${base}/api/resources/homepage-spotlight-${locale}`, { credentials: "omit" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && (data.title || data.body)) setCms({ title: data.title, body: data.body });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale]);
  const fallback = SPOTLIGHT_FALLBACK[locale];
  const stripHtml = (html: string): string =>
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const title = cms?.title || fallback.title;
  const body = cms?.body ? stripHtml(cms.body) : fallback.body;
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1160px] px-5 md:px-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {fallback.eyebrow}
        </p>
        <h2 className="mt-4 font-serif text-[36px] leading-[.98] tracking-[-0.05em] md:text-[48px]">
          {title}
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
          {body}
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fallback.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-border/60 bg-surface p-4 text-[12.5px] font-medium"
            >
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/chat"
          search={{ query: fallback.prompt } as never}
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 bg-background px-5 text-[11px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
        >
          {fallback.cta} <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
