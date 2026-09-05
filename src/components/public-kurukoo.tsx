import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Check, Compass, Heart, MessageCircle, Mic2, Network, Play, Search, ShieldCheck, Sparkles, Target, Users, Wallet, Zap } from "lucide-react";
import { Composer } from "@/components/kurukoo/composer";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const capabilities = [
  [Sparkles, "Conversation", "Start with what you need. Kurukoo turns plain language into useful next steps."],
  [Target, "Requests & Work", "Keep the request alive from first ask through coordination and completion."],
  [Compass, "Explore", "Discover people, places, services, ideas and opportunities in context."],
  [ShieldCheck, "Trust", "Provider information, verification and commitments are evidence- and consent-gated."],
  [Bell, "Activity & Reminders", "Stay on top of what is moving, what needs attention and what comes next."],
  [Heart, "Memory & Saved", "Keep useful context so Kurukoo can become more helpful over time."],
  [Users, "Topics & Network", "Connect with people and conversations without losing the useful context around them."],
  [Wallet, "Wallet, Points & Plans", "Handle value, rewards and access as part of the same experience."],
  [Network, "Connect & Capabilities", "Bring services, tools and trusted connections into one coordinated layer."],
];

const examples = [
  { ask: "I need a reliable electrician tomorrow", result: "Find trusted options → compare → confirm → coordinate" },
  { ask: "Help me prepare for my client call", result: "Understand the task → gather context → prepare → keep it moving" },
  { ask: "Find somewhere good for dinner nearby", result: "Explore nearby → see useful context → choose → act" },
];

function PublicRail({ children }: { children?: ReactNode }) {
  return <aside className="hidden w-[200px] shrink-0 flex-col border-r border-border bg-surface/80 px-3 py-6 backdrop-blur md:flex">
    <Link to="/" className="flex items-center gap-2 px-2 pb-7"><span className="grid size-7 place-items-center rounded-lg bg-[#f4e6dc] text-[13px] font-semibold text-[#765443]">K</span><span className="text-[16px] font-semibold tracking-[-0.025em]">Kurukoo</span></Link>
    <nav aria-label="Public Kurukoo navigation" className="space-y-1">
      <Link to="/" className="flex items-center gap-3 rounded-xl bg-[#f4e6dc] px-3 py-2.5 text-[13.5px] font-medium"><Sparkles className="size-[18px]" />Home</Link>
      <Link to="/explore" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-muted-foreground hover:bg-elevated hover:text-foreground"><Compass className="size-[18px]" />Explore</Link>
      <Link to="/topics" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-muted-foreground hover:bg-elevated hover:text-foreground"><MessageCircle className="size-[18px]" />Topics</Link>
      <Link to="/opportunities" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-muted-foreground hover:bg-elevated hover:text-foreground"><Zap className="size-[18px]" />Opportunities</Link>
    </nav>
    <p className="px-3 pb-1 pt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p>
    <nav className="space-y-1">
      {[["/work","Work"],["/activity","Activity"],["/reminders","Reminders"],["/saved","Saved"],["/memory","Memory"],["/capabilities","Capabilities"],["/wallet","Wallet"],["/points","Points"],["/plans","Plans"],["/connect","Connect"]].map(([to,label]) => <Link key={to} to={to as never} className="flex items-center rounded-xl px-3 py-2 text-[12.5px] text-muted-foreground hover:bg-elevated hover:text-foreground">{label}</Link>)}
    </nav>
    <div className="mt-auto border-t border-border pt-4 px-2"><Link to="/login" className="flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-[12px] font-medium">Sign in</Link><Link to="/signup" className="mt-2 flex items-center justify-center rounded-xl bg-foreground px-3 py-2 text-[12px] font-medium text-background">Get started</Link></div>
    {children}
  </aside>;
}

function PublicContextRail() {
  return <aside aria-label="Kurukoo public context rail" className="hidden w-[224px] shrink-0 flex-col overflow-y-auto border-l border-[#e7e0d7] bg-[#f5f1eb] px-3 py-4 lg:flex dark:border-border dark:bg-background">
    <section className="rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 dark:border-border dark:bg-surface"><div className="flex items-center gap-2"><ShieldCheck className="size-[15px] text-muted-foreground" /><h2 className="text-[13px] font-semibold">Trusted by design</h2></div><div className="mt-3 space-y-2"><p className="text-[11.5px] leading-relaxed text-muted-foreground">No invented availability or pricing. Useful provider information is grounded in evidence.</p><p className="text-[11.5px] leading-relaxed text-muted-foreground">Kurukoo asks before making commitments on your behalf.</p></div></section>
    <section className="mt-3 rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 dark:border-border dark:bg-surface"><div className="flex items-center gap-2"><Zap className="size-[15px] text-muted-foreground" /><h2 className="text-[13px] font-semibold">What Kurukoo can do</h2></div><div className="mt-2.5 space-y-1.5">{["Turn a conversation into a request","Find and compare useful options","Coordinate the next step","Remember useful context","Keep work and activity connected"].map((x) => <div key={x} className="flex gap-2 text-[11px] text-muted-foreground"><Check className="mt-0.5 size-3.5 shrink-0 text-[var(--color-success)]" />{x}</div>)}</div></section>
    <section className="mt-3 rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 dark:border-border dark:bg-surface"><div className="flex items-center gap-2"><Search className="size-[15px] text-muted-foreground" /><h2 className="text-[13px] font-semibold">Nearby pulse</h2></div><div className="mt-2.5 space-y-2 text-[11px] text-muted-foreground"><div className="flex justify-between"><span>Discovery</span><span>Local</span></div><div className="flex justify-between"><span>Context</span><span>Useful</span></div><div className="flex justify-between"><span>Trust</span><span>Protected</span></div></div></section>
  </aside>;
}

export function PublicKurukooShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><PublicRail /><div className="flex min-h-screen md:pl-[200px]"><main className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"><div className="mx-auto flex h-12 w-full items-center justify-between px-5 lg:px-7"><Link to="/" className="font-semibold tracking-[-0.025em] md:hidden">Kurukoo</Link><nav className="hidden items-center gap-7 text-[12.5px] text-muted-foreground md:flex"><Link to="/explore" className="hover:text-foreground">Explore</Link><Link to="/about" className="hover:text-foreground">How it works</Link><Link to="/capabilities" className="hover:text-foreground">Capabilities</Link></nav><div className="ml-auto flex items-center gap-2"><Link to="/login" className="rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">Sign in</Link><Link to="/signup" className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">Get started</Link></div></div></header><div className="flex min-h-[calc(100vh-49px)]"><div className="min-w-0 flex-1">{children}</div><PublicContextRail /></div></main></div></div>;
}

export function PublicHome({ onSend }: { onSend?: (message: string) => void }) {
  return <div className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-12 md:px-8 md:pt-16">
    <section className="relative overflow-hidden rounded-[28px] border border-border bg-surface px-6 py-10 md:px-10 md:py-14"><div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#f4e6dc]/70 blur-3xl" /><div className="relative max-w-3xl"><p className="mb-2 text-[13px] font-medium text-muted-foreground">Your everyday, moving forward.</p><h1 className="font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">Tell Kurukoo what needs doing</h1><p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">A conversation-first OS for getting useful things done — from the first ask to the next real-world step.</p><div className="mt-7 max-w-[850px]"><Composer onSend={onSend ?? (() => undefined)} placeholder="What needs your attention?" /></div><p className="mt-3 text-[12px] text-muted-foreground">Here’s the useful part of our day</p></div></section>
    <section className="py-10 md:py-12"><div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">See it in motion</p><h2 className="mt-1 text-[24px] font-semibold tracking-tight">Start with a need. Kurukoo carries it forward.</h2></div><Link to="/chat" className="hidden items-center gap-1 text-[12px] font-medium text-primary md:flex">Try conversation <ArrowRight className="size-3.5" /></Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{examples.map((example) => <Link key={example.ask} to="/chat" className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f4e6dc] text-[#765443]"><MessageCircle className="size-4" /></span><div><p className="text-[13px] font-medium leading-snug">“{example.ask}”</p><p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{example.result}</p></div></div></Link>)}</div></section>
    <section className="border-y border-border py-10 md:py-12"><div className="max-w-2xl"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">One OS, many moments</p><h2 className="mt-1 text-[24px] font-semibold tracking-tight">Everything useful stays connected.</h2><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Conversation is the entry point. Requests, discovery, trust, work, activity, memory and coordination are the continuity underneath.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon,title,detail]) => { const C = Icon as typeof Sparkles; return <div key={title as string} className="rounded-2xl border border-border bg-surface p-4"><C className="size-5 text-muted-foreground" strokeWidth={1.7} /><h3 className="mt-3 text-[13.5px] font-semibold">{title as string}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail as string}</p></div>; })}</div></section>
    <section className="py-10 md:py-12"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center gap-3"><Mic2 className="size-5 text-muted-foreground" /><div><h3 className="text-[14px] font-semibold">Conversation, including voice</h3><p className="mt-1 text-[11.5px] text-muted-foreground">Talk naturally, then let Kurukoo carry the useful state forward.</p></div></div></div><div className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center gap-3"><Network className="size-5 text-muted-foreground" /><div><h3 className="text-[14px] font-semibold">Context wherever you go</h3><p className="mt-1 text-[11.5px] text-muted-foreground">Trusted context and QR-connected experiences can bring the right information into the moment.</p></div></div></div></div></section>
    <section className="rounded-[24px] border border-border bg-surface p-6 text-center md:p-10"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Enter Kurukoo</p><h2 className="mt-2 text-[28px] font-semibold tracking-tight">Don’t learn another dashboard.</h2><p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">Just say what needs doing. Kurukoo gives the next useful step a place to go.</p><div className="mt-5 flex justify-center gap-2"><Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[12px] font-medium text-background">Get started <ArrowRight className="size-3.5" /></Link><Link to="/chat" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[12px] font-medium">Try conversation <Play className="size-3.5" /></Link></div></section>
  </div>;
}
