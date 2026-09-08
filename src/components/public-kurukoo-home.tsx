import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Megaphone,
  Mic2,
  Network,
  MessageCircle,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { KURUKOO_PUBLIC_ROLES } from "@/lib/kurukoo-personas";

const examples = [
  [
    "I need a reliable electrician tomorrow",
    "Find trusted options → compare → confirm → coordinate",
    "Request · Providers · Trust",
  ],
  [
    "Help me prepare for my client call",
    "Understand the task → gather context → prepare → keep it moving",
    "Conversation · Memory · Work",
  ],
  [
    "Find somewhere good for dinner nearby",
    "Explore nearby → see useful context → choose → act",
    "Explore · Nearby · Action",
  ],
  [
    "Remind me to follow up with the client Friday",
    "Capture it once → schedule the reminder → keep the context with it",
    "Reminder · Activity · Memory",
  ],
  [
    "What opportunities are opening up around me?",
    "Spot relevant opportunities → understand them → decide what to do next",
    "Opportunities · Explore · Network",
  ],
  [
    "Save this place and remember why I liked it",
    "Keep the place, the reason and the useful context together",
    "Saved · Memory · Places",
  ],
];
const prompts = [
  "Find a trusted provider",
  "Help me plan my day",
  "Show me opportunities",
  "Remember this for later",
  "What’s happening nearby",
  "Help me get this done",
  "Get a Ride",
  "Order Food",
  "Sell Item",
];
const publicRoleIcons = {
  seeker: Users,
  provider: Target,
  business: Network,
  creator: Sparkles,
  contributor: Users,
  partner: Network,
  advertiser: Megaphone,
  "local-agent": Zap,
} as const;
const whoServes = KURUKOO_PUBLIC_ROLES.map((role) => [
  publicRoleIcons[role.id],
  role.title,
  role.description,
  role.to,
  role.cta,
] as const);
const capabilities = [
  [
    Sparkles,
    "Conversation",
    "Start with what you need. Kurukoo turns plain language into useful next steps.",
  ],
  [
    Target,
    "Requests & Work",
    "Keep the request alive from first ask through coordination and completion.",
  ],
  [
    Network,
    "Explore & Network",
    "Discover people, places, services, ideas and opportunities in context.",
  ],
  [
    ShieldCheck,
    "Trust",
    "Provider information, verification and commitments are evidence- and consent-gated.",
  ],
  [
    Zap,
    "Activity & Reminders",
    "See what is moving, what needs attention and where proactive help can open up.",
  ],
  [Heart, "Memory & Saved", "Keep useful context so Kurukoo can become more helpful over time."],
  [
    Users,
    "Topics & Opportunities",
    "Connect with people, conversations and possibilities around you.",
  ],
  [
    Wallet,
    "Wallet, Points & Plans",
    "Handle value, rewards and access as part of the same experience.",
  ],
  [
    Mic2,
    "Voice & Context",
    "Talk naturally and bring trusted context into the moment, including through QR experiences.",
  ],
];
export function PublicHome({ onSend }: { onSend?: (message: string) => void }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  useEffect(() => {
    const a = window.setInterval(() => setExampleIndex((v) => (v + 1) % examples.length), 4800);
    const b = window.setInterval(() => setPromptIndex((v) => (v + 1) % prompts.length), 6200);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, []);
  const shufflePrompts = () =>
    setPromptIndex((current) => {
      if (prompts.length < 2) return current;
      let next = current;
      while (next === current) next = Math.floor(Math.random() * prompts.length);
      return next;
    });
  const sendPrompt = (prompt: string) => {
    onSend?.(prompt);
    window.location.href = "/chat";
  };
  return (
    <div className="w-full pb-8">
      <section className="relative pb-10 md:pb-12">
        <div className="pointer-events-none absolute -right-32 -top-28 size-[440px] rounded-full bg-brand-tint/65 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[30%] size-48 rounded-full bg-brand-tint/25 blur-3xl" />
        <div className="relative max-w-[900px]">
          <p className="mb-3 text-[13px] font-medium text-primary">
            Your everyday, moving forward.
          </p>
          <h1
            id="home-hero-title"
            className="max-w-[820px] font-sans text-[40px] font-bold leading-[1.03] tracking-[-0.05em] text-foreground"
          >
            <span className="block">Tell Kurukoo</span>
            <span className="block">what needs doing</span>
          </h1>
          <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-muted-foreground">
            A conversation-first way to discover, decide and get useful things moving — without
            having to figure out which app or workflow comes next.
          </p>
          <div className="mt-7 max-w-[900px]">
            <Composer
              onSend={onSend ?? (() => undefined)}
              placeholder="What needs your attention?"
            />
          </div>
          <div
            className="mt-3 flex w-full min-w-0 items-center gap-2"
            aria-label="Try Kurukoo prompts"
          >
            <span className="sr-only">Try a suggested prompt</span>
            <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-2 pr-1">
                {Array.from({ length: Math.min(6, prompts.length) }, (_, offset) => {
                  const prompt = prompts[(promptIndex + offset) % prompts.length] ?? prompts[0]!;
                  return (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendPrompt(prompt)}
                      className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background/75 px-3 py-1.5 text-[10.5px] font-medium text-foreground dark:text-primary transition-colors hover:bg-brand-tint/30"
                    >
                      {prompt}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={shufflePrompts}
              aria-label="Shuffle suggested prompts"
              title="Shuffle suggested prompts"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background/75 text-foreground dark:text-primary transition-colors hover:bg-brand-tint/30"
            >
              <Shuffle className="size-4" strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </section>
      <section className="border-t border-border/70 py-9 md:py-11">
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(245px,.72fr)_minmax(0,1.8fr)] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Who Kurukoo serves
            </p>
            <h2 className="mt-1.5 text-[24px] font-bold tracking-tight text-foreground">
              One network, many ways to participate.
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Kurukoo brings together people who need something, people who provide it, businesses and
              creators, contributors and partners, advertisers and local agents.
            </p>
          </div>
          <div
            className="min-w-0 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Who Kurukoo serves"
          >
            <div className="flex w-max min-w-full gap-3">
              {whoServes.map(([Icon, title, detail, to, label]) => {
                const C = Icon as typeof Users;
                return (
                  <Link
                    key={title as string}
                    to={to as never}
                    className="group flex min-h-[205px] w-[205px] shrink-0 flex-col rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated/55"
                  >
                    <C className="size-5 text-primary" strokeWidth={1.7} />
                    <h3 className="mt-3 text-[14px] font-semibold">{title as string}</h3>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                      {detail as string}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[10.5px] font-medium">
                      {label as string}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-border/70 py-9 md:py-11">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              See it in motion
            </p>
            <h2 className="mt-1.5 text-[24px] font-bold tracking-tight">
              Start with a need. Kurukoo carries it forward.
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExampleIndex((v) => (v - 1 + examples.length) % examples.length)}
              aria-label="Previous example"
              className="grid size-8 place-items-center rounded-full border border-border hover:bg-elevated"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setExampleIndex((v) => (v + 1) % examples.length)}
              aria-label="Next example"
              className="grid size-8 place-items-center rounded-full border border-border hover:bg-elevated"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-5 overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-500"
            style={{ transform: `translateX(-${exampleIndex * 33.333}%)` }}
          >
            {examples.map(([ask, result, meta]) => (
              <Link
                key={ask}
                to="/chat"
                className="min-w-[86%] rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated sm:min-w-[62%] md:min-w-[32%]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                    <MessageCircle className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium leading-snug">“{ask}”</p>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                      {result}
                    </p>
                    <p className="mt-3 text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted-foreground">
                      {meta}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-border/70 py-9 md:py-11">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            One OS, many moments
          </p>
          <h2 className="mt-1.5 text-[24px] font-bold tracking-tight">
            Ask, organise, coordinate or discover.
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Conversation is the entry point. Requests, discovery, trust, work, activity, memory and
            coordination are the continuity underneath.
          </p>
          <p className="mt-3 text-[14px] font-medium tracking-tight text-foreground">
            Everything useful stays connected.
          </p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([Icon, title, detail]) => {
            const C = Icon as typeof Sparkles;
            return (
              <div
                key={title as string}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <C className="size-5 text-primary" strokeWidth={1.7} />
                <h3 className="mt-3 text-[13.5px] font-semibold">{title as string}</h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {detail as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="py-9 md:py-11">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <Mic2 className="size-5 text-primary" />
              <div>
                <h3 className="text-[14px] font-semibold">Conversation, including live voice</h3>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Talk naturally, then let Kurukoo carry the useful state forward.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <Network className="size-5 text-primary" />
              <div>
                <h3 className="text-[14px] font-semibold">Context wherever you go</h3>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Trusted context and QR-connected experiences can bring the right information into
                  the moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
