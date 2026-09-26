import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  Coffee,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  Shuffle,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Users,
  Wrench,
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
    ["Find a reliable plumber tomorrow", "Tell us what needs doing and where. We will help you work out the next step."],
    ["Prepare me for my client call", "Bring together the useful details, shape the plan, and keep it with you."],
    ["When is my MOT due?", "Keep important dates and reminders in one place so they do not slip past."],
  ],
  ng: [
    ["Find a reliable electrician tomorrow", "Tell us what needs doing and where. We will help you work out the next step."],
    ["Prepare me for my client call", "Bring together the useful details, shape the plan, and keep it with you."],
    ["Find somewhere good for dinner nearby", "Start with what you want and narrow it down with useful local context."],
  ],
};

const dayMoments: Record<
  KurukooLocale,
  readonly { time: string; Icon: typeof Sun; title: string; subtitle: string; prompt: string }[]
> = {
  gb: [
    { time: "06:30", Icon: Sun, title: "Wake up", subtitle: "Need a lift this morning?", prompt: "Get me a ride to the station" },
    { time: "09:00", Icon: ShoppingBag, title: "Morning errand", subtitle: "Pick up a prescription on the way to work.", prompt: "Find someone to pick up a prescription" },
    { time: "12:00", Icon: Coffee, title: "Lunch break", subtitle: "Looking for lunch nearby?", prompt: "Find somewhere good for lunch nearby" },
    { time: "14:00", Icon: Wrench, title: "Get it fixed", subtitle: "Describe the repair and your postcode.", prompt: "Find someone to fix my boiler" },
    { time: "16:00", Icon: Store, title: "Hustle time", subtitle: "Want to offer a skill? Tell us what you do.", prompt: "I can assemble flatpack this week" },
    { time: "18:00", Icon: Car, title: "Send it", subtitle: "Share pickup and delivery details to coordinate a parcel.", prompt: "Help me send a package to my client" },
  ],
  ng: [
    { time: "06:30", Icon: Sun, title: "Wake up", subtitle: "Need a lift this morning?", prompt: "Get me a ride to the airport" },
    { time: "09:00", Icon: ShoppingBag, title: "Morning errand", subtitle: "Pick up a prescription on the way to work.", prompt: "Find someone to pick up a prescription" },
    { time: "12:00", Icon: Coffee, title: "Lunch break", subtitle: "Looking for lunch nearby?", prompt: "Find somewhere good for lunch nearby" },
    { time: "14:00", Icon: Wrench, title: "Get it fixed", subtitle: "Describe the repair and your area.", prompt: "Find someone to fix my phone" },
    { time: "16:00", Icon: Store, title: "Hustle time", subtitle: "Want to offer a skill? Tell us what you do.", prompt: "I can repair iPhones this week" },
    { time: "18:00", Icon: Car, title: "Send it", subtitle: "Share pickup and delivery details to coordinate a parcel.", prompt: "Help me send a package to my client" },
  ],
};

const featuredIntegrations = integrations
  .filter((integration) => integration.status === "available" || integration.status === "native")
  .slice(0, 10);

const howItWorks = [
  [MessageCircle, "Tell us what you need", "No category or form to learn. Just say it in your own words."],
  [Search, "We work out the next step", "Kurukoo brings together the details, options and people that matter."],
  [CheckCircle2, "You see what happens", "Important actions are shown to you first, then the request keeps moving."],
] as const;

function HowStepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="how-step-visual how-step-visual-message">
        <span className="how-step-bubble">I need help with dinner tonight</span>
        <span className="how-step-caret" />
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="how-step-visual how-step-visual-route">
        <span><MapPin className="size-3" /> Where</span>
        <span><CalendarDays className="size-3" /> When</span>
        <span><Sparkles className="size-3" /> What matters</span>
      </div>
    );
  }
  return (
    <div className="how-step-visual how-step-visual-confirm">
      <CheckCircle2 className="size-5" />
      <span>Ready for your say-so</span>
    </div>
  );
}

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
  }, [localePrompts.length]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setDayIndex((value) => (value + 1) % localeMoments.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [localeMoments.length]);

  const sendPrompt = (prompt: string) => {
    onSend?.(prompt);
    window.location.href = "/chat";
  };
  const shuffle = () =>
    setPromptIndex(
      (value) => (value + 1 + Math.floor(Math.random() * (localePrompts.length - 1))) % localePrompts.length,
    );

  return (
    <div className="kurukoo-home w-full pb-12">
      <section id="public-home-hero" className="relative overflow-hidden border-b border-border/80 py-6 md:py-8">
        <div className="pointer-events-none absolute -right-24 -top-32 size-[560px] rounded-full bg-brand-tint/30 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-25%] left-[12%] size-[360px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative grid min-h-[520px] items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)]">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Your everyday helper
            </div>
            <h1 className="max-w-3xl text-[52px] leading-[.96] tracking-[-0.065em]">
              Tell us what you need.
              <br />
              <span className="text-muted-foreground/70">We will help you get it done.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-[17px]">
              Ask Kurukoo about anything in your day. We help you find answers, make plans, find people and services, and keep track of what matters.
            </p>
            <div className="mt-8 max-w-3xl">
              <Composer onSend={onSend ?? (() => undefined)} voiceOverlayTargetId="public-home-hero" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
                <div className="flex min-w-max gap-2">
                  {Array.from({ length: 4 }, (_, offset) => {
                    const prompt = localePrompts[(promptIndex + offset) % localePrompts.length];
                    return (
                      <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} className="shrink-0 rounded-full border border-border/80 bg-background/70 px-3 py-2 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
                        {prompt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={shuffle} aria-label="Shuffle prompts" className="grid size-9 shrink-0 place-items-center rounded-full border border-border/80 bg-background/70 text-muted-foreground hover:text-foreground">
                <Shuffle className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="relative hidden min-h-[360px] lg:block" aria-label="A Kurukoo request in progress">
            <div className="absolute right-2 top-1/2 w-[340px] -translate-y-1/2 rounded-[28px] border border-border bg-surface/95 p-5 shadow-[var(--shadow-lift)]">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <span className="flex items-center gap-2 text-[11px] font-semibold"><span className="grid size-7 place-items-center rounded-full bg-brand-tint text-brand-ink"><Sparkles className="size-3.5" /></span>Kurukoo</span>
                <span className="rounded-full bg-elevated px-2 py-1 text-[9px] text-muted-foreground">Working with you</span>
              </div>
              <div className="py-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Your request</p>
                <p className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.03em]">“I need dinner for tonight.”</p>
                <div className="mt-5 grid gap-2">
                  <div className="flex items-center gap-3 rounded-xl bg-elevated/70 p-3"><span className="grid size-8 place-items-center rounded-lg bg-background text-primary"><Search className="size-4" /></span><span className="grid gap-0.5"><strong className="text-[11px]">Finding useful options</strong><small className="text-[9.5px] text-muted-foreground">Based on your place and preferences</small></span><Check className="ml-auto size-3.5 text-success" /></div>
                  <div className="flex items-center gap-3 rounded-xl bg-brand-tint/35 p-3"><span className="grid size-8 place-items-center rounded-lg bg-background text-primary"><Users className="size-4" /></span><span className="grid gap-0.5"><strong className="text-[11px]">Keeping the details together</strong><small className="text-[9.5px] text-muted-foreground">You decide before anything important happens</small></span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border/70 pt-4 text-[10px] text-muted-foreground"><ShieldCheck className="size-3.5 text-success" /> You stay in control</div>
            </div>
            <div className="absolute bottom-10 left-0 w-[190px] rounded-2xl border border-border bg-background/90 p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-[10px] font-semibold"><MapPin className="size-3.5 text-primary" /> Around you</div>
              <p className="mt-3 text-[12px] leading-5 text-muted-foreground">People, places and services can become part of the answer when they are relevant.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="how-title">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
            <h2 id="how-title" className="mt-3 max-w-md text-[38px] leading-[.98] tracking-[-0.06em] md:text-[54px]">Start with a message. End with a useful next step.</h2>
            <p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">You do not need to know which app, service or person can help. Start with the thing you want to happen.</p>
            <Link to="/how-it-works" className="mt-6 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80">See how Kurukoo works <ArrowUpRight className="size-3.5" /></Link>
          </div>
          <div className="border-t border-border/80">
            {howItWorks.map(([Icon, title, detail], index) => (
              <div key={title} className="grid gap-4 border-b border-border/80 py-6 sm:grid-cols-[34px_190px_150px_minmax(0,1fr)] sm:items-center">
                <span className="text-[10px] tabular-nums text-muted-foreground">0{index + 1}</span>
                <div className="flex items-center gap-2"><Icon className="size-4 text-primary" strokeWidth={1.7} /><p className="text-[13px] font-semibold">{title}</p></div>
                <HowStepVisual index={index} />
                <p className="text-[11.5px] leading-5 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="real-life-title">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Made for real life</p><h2 id="real-life-title" className="mt-3 text-[38px] leading-[.98] tracking-[-0.06em] md:text-[54px]">Small asks. Big days. One place to start.</h2></div>
          <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">From getting somewhere to getting something sorted, Kurukoo helps you move from “I need…” to “that’s done.”</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="group relative min-h-[360px] overflow-hidden rounded-[26px] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
            <div className="absolute -right-12 -top-16 size-64 rounded-full bg-brand-tint/70 blur-2xl transition-transform duration-500 group-hover:scale-110" />
            <div className="relative"><span className="grid size-10 place-items-center rounded-xl bg-background text-primary"><CalendarDays className="size-5" /></span><h3 className="mt-20 max-w-xs text-[27px] leading-[1.02] tracking-[-0.05em]">Plan the day without juggling six apps.</h3><p className="mt-3 max-w-sm text-[12px] leading-5 text-muted-foreground">Reminders, rides, errands, research and plans can stay connected to the same conversation.</p><div className="mt-7 grid max-w-sm gap-2"><span className="flex items-center gap-2 rounded-xl border border-border bg-background/80 p-3 text-[11px]"><Sun className="size-3.5 text-primary" /> Remind me about bin day <Check className="ml-auto size-3 text-success" /></span><span className="flex items-center gap-2 rounded-xl border border-border bg-background/80 p-3 text-[11px]"><Car className="size-3.5 text-primary" /> Get me a ride tomorrow <ArrowRight className="ml-auto size-3 text-muted-foreground" /></span></div></div>
          </div>
          <div className="group relative min-h-[360px] overflow-hidden rounded-[26px] border border-border bg-foreground p-6 text-background shadow-[var(--shadow-soft)]">
            <div className="absolute -bottom-20 -right-10 size-64 rounded-full bg-primary/40 blur-3xl transition-transform duration-500 group-hover:scale-110" />
            <div className="relative"><span className="grid size-10 place-items-center rounded-xl bg-background/10 text-background"><Network className="size-5" /></span><h3 className="mt-20 max-w-xs text-[27px] leading-[1.02] tracking-[-0.05em]">Find the people and services that can help.</h3><p className="mt-3 max-w-sm text-[12px] leading-5 text-background/65">When something needs a person, place or provider, Kurukoo helps you find a useful route without pretending a result is confirmed before it is.</p><div className="mt-7 flex max-w-sm flex-wrap gap-2"><span className="rounded-full bg-background/10 px-3 py-2 text-[10px]">Repairs</span><span className="rounded-full bg-background/10 px-3 py-2 text-[10px]">Food</span><span className="rounded-full bg-background/10 px-3 py-2 text-[10px]">Getting around</span><span className="rounded-full bg-background/10 px-3 py-2 text-[10px]">Work & tasks</span></div></div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border/80 py-14 md:py-20" aria-labelledby="integrations-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Connect what matters</p><h2 id="integrations-title" className="mt-3 text-[38px] leading-[.98] tracking-[-0.06em] md:text-[54px]">Your tools. Your places. Your context.</h2><p className="mt-4 text-[14px] leading-6 text-muted-foreground">Bring the sources you choose into the conversation. Connections stay visible and under your control.</p></div><Link to="/integrations" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80">Browse integrations <ArrowRight className="size-3.5" /></Link></div>
        <div className="relative mt-10 overflow-hidden border-y border-border/80 py-4"><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" /><div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" /><div className="flex min-w-max animate-[marquee_28s_linear_infinite] gap-3 pr-3 motion-reduce:animate-none">{[...featuredIntegrations, ...featuredIntegrations].map((integration, index) => { const Icon = integration.icon; return <Link key={`${integration.slug}-${index}`} to="/integrations" className="flex min-w-[170px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-elevated"><span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><Icon className="size-4" /></span><span className="grid gap-0.5"><strong className="text-[11px] font-semibold">{integration.name}</strong><small className="text-[9.5px] text-muted-foreground">{integration.category}</small></span></Link>; })}</div></div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="examples-title">
        <div className="flex items-end justify-between gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Try a real request</p><h2 id="examples-title" className="mt-3 text-[38px] leading-none tracking-[-0.06em] md:text-[54px]">Start with the thing on your mind.</h2></div><div className="flex gap-1"><button type="button" onClick={() => setExampleIndex((value) => (value + localeExamples.length - 1) % localeExamples.length)} aria-label="Previous example" className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">←</button><button type="button" onClick={() => setExampleIndex((value) => (value + 1) % localeExamples.length)} aria-label="Next example" className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">→</button></div></div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">{localeExamples.map(([ask, answer], index) => <Link key={ask} to="/chat" className={`group min-h-[220px] rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-elevated ${index === exampleIndex ? "ring-1 ring-inset ring-primary/25" : ""}`}><span className="text-[10px] tabular-nums text-muted-foreground">0{index + 1}</span><p className="mt-12 max-w-sm text-[17px] font-medium leading-[1.25] tracking-[-0.02em]">“{ask}”</p><p className="mt-4 max-w-sm text-[11.5px] leading-5 text-muted-foreground">{answer}</p><span className="mt-7 inline-flex items-center gap-1 text-[10.5px] font-medium">Try it <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20" aria-labelledby="day-title">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">A day with Kurukoo</p><h2 id="day-title" className="mt-3 text-[38px] leading-[.98] tracking-[-0.06em] md:text-[54px]">Keep life moving, one thing at a time.</h2><p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">One conversation can hold the small things that make the rest of the day easier.</p></div><div><div className="flex items-end justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{localeMoments[dayIndex].time}</p><div className="flex gap-1"><button type="button" onClick={() => setDayIndex((value) => (value + localeMoments.length - 1) % localeMoments.length)} aria-label="Previous day moment" className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">←</button><button type="button" onClick={() => setDayIndex((value) => (value + 1) % localeMoments.length)} aria-label="Next day moment" className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">→</button></div></div><div className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink">{(() => { const Icon = localeMoments[dayIndex].Icon; return <Icon className="size-5" />; })()}</span><div><h3 className="text-[18px] font-semibold">{localeMoments[dayIndex].title}</h3><p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{localeMoments[dayIndex].subtitle}</p></div></div><button type="button" onClick={() => sendPrompt(localeMoments[dayIndex].prompt)} className="mt-5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80">Try it in Chat <ArrowRight className="size-3" /></button></div></div></div>
      </section>

      <section className="border-b border-border/80 py-14 md:py-20"><div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your control</p><h2 className="mt-3 text-[38px] leading-[.98] tracking-[-0.06em] md:text-[54px]">Helpful does not mean out of your hands.</h2><p className="mt-5 max-w-xl text-[14px] leading-6 text-muted-foreground">Kurukoo shows you what is known, what is still being checked, and what needs your say-so. Your conversations and memory stay yours.</p><div className="mt-7 flex flex-wrap gap-4"><Link to="/legal/$section" params={{ section: "privacy" }} className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:opacity-70">Privacy policy <ArrowRight className="size-3" /></Link><Link to="/legal/$section" params={{ section: "safety" }} className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:opacity-70">Trust & safety <ArrowRight className="size-3" /></Link></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-surface p-5"><ShieldCheck className="size-5 text-primary" /><p className="mt-10 text-[12px] font-semibold">You approve first</p><p className="mt-2 text-[10.5px] leading-5 text-muted-foreground">Important actions need your sign-off.</p></div><div className="rounded-2xl border border-border bg-surface p-5"><Lock className="size-5 text-primary" /><p className="mt-10 text-[12px] font-semibold">Data stays private</p><p className="mt-2 text-[10.5px] leading-5 text-muted-foreground">Your conversations are not sold.</p></div><div className="rounded-2xl border border-border bg-surface p-5"><Heart className="size-5 text-primary" /><p className="mt-10 text-[12px] font-semibold">Memory is yours</p><p className="mt-2 text-[10.5px] leading-5 text-muted-foreground">Keep, edit or forget what you choose.</p></div></div></div></section>

      <section className="py-14 md:py-20"><div className="relative overflow-hidden rounded-[28px] bg-foreground px-6 py-12 text-background md:px-10 md:py-16"><div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/35 blur-3xl" /><div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-background/55">Ready when you are</p><h2 className="mt-4 max-w-2xl text-[42px] leading-[.98] tracking-[-0.06em] md:text-[62px]">Bring one thing.<br />Then another.</h2><p className="mt-5 max-w-xl text-[13px] leading-6 text-background/65">Start with a message. Kurukoo will help you work out what comes next.</p></div><Link to="/chat" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-background px-5 text-[11px] font-semibold text-foreground transition-transform hover:-translate-y-0.5">Start with Kurukoo <ArrowRight className="size-4" /></Link></div></div></section>
    </div>
  );
}
