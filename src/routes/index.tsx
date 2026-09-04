import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, CirclePlay, Compass, Gift, MessageCircle, Mic2, Plus, Sparkles, Users, SunMedium, Waves, Building2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { Panel, ContextIconTile, StatusPill, FlowEvent, ActiveRequestRow } from "@/components/kurukoo/ui";
import { useKurukoo } from "@/lib/kurukoo-store";
import { cn } from "@/lib/utils";

const description = "Your personal workspace for getting useful things done with Kurukoo.";
export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Home — Kurukoo" }, { name: "description", content: description }, { property: "og:title", content: "Home — Kurukoo" }, { property: "og:description", content: description }] }), component: HomePage });

function SectionTitle({ title, to, action }: { title: string; to?: string; action?: string }) { return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>{to && action ? <Link to={to as never} className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">{action}<ArrowUpRight className="size-3.5" /></Link> : null}</div>; }
function IconTile({ children, className }: { children: ReactNode; className?: string }) { return <ContextIconTile className={className}>{children}</ContextIconTile>; }

function HomeHorizonIllustration() {
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-45">
    <div className="absolute -bottom-16 left-[8%] size-48 rounded-full border border-[#d7bca8]/40" />
    <div className="absolute -bottom-20 right-[9%] size-64 rounded-full border border-[#d7bca8]/30" />
    <div className="absolute bottom-7 left-0 right-0 h-px bg-border" />
    <div className="absolute bottom-7 left-[12%] flex items-end gap-2 text-muted-foreground/50"><Building2 className="size-8" /><Building2 className="mb-2 size-5" /><Waves className="mb-0 size-12" /></div>
    <SunMedium className="absolute right-[18%] bottom-10 size-8 text-[#c9a47f]/60" />
  </div>;
}

function HomePage() {
  const { messages, work, send } = useKurukoo();
  const [showAllFlow, setShowAllFlow] = useState(false);
  const active = work.filter((w) => w.stage !== "done").slice(0, 3);
  const recentMessage = messages.filter((m) => m.role === "kurukoo").at(-1);
  return <div className="space-y-6">
    <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
      <div><p className="text-[12px] text-muted-foreground">Tuesday · 27 May 2030 · Accra</p><h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.035em] md:text-[34px]">Good afternoon, Ada</h1><p className="mt-1.5 text-[14px] text-muted-foreground">Here’s the useful part of your day.</p></div>
      <div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-elevated px-3 py-1.5 text-[12px] text-muted-foreground">☀ 23°C · Osu</span><Link to="/activity" aria-label="Open activity" className="grid size-9 place-items-center rounded-full border border-border bg-surface hover:bg-elevated"><span className="size-2 rounded-full bg-primary" /></Link></div>
    </header>

    <section aria-labelledby="home-hero-title" className="relative overflow-hidden rounded-[30px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-7">
      <div className="pointer-events-none absolute -right-8 -top-16 size-56 rounded-full bg-[#f4e6dc]/70 blur-3xl" />
      <HomeHorizonIllustration />
      <div className="relative z-10"><div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground"><Sparkles className="size-3.5" />Home</div><h2 id="home-hero-title" className="mt-2 max-w-2xl text-[24px] font-semibold tracking-[-0.03em] md:text-[30px]">Wake up. Get going.</h2><p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">What needs your attention? Ask plainly and Kurukoo will help carry the next useful step.</p><div className="mt-5"><Composer onSend={send} placeholder="What needs your attention?" /></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => send("Find me a plumber.")} className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-elevated">Find a plumber</button><button type="button" onClick={() => send("Book me a dentist.")} className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-elevated">Book a dentist</button><button type="button" onClick={() => send("What am I waiting for?")} className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-elevated">What am I waiting for?</button></div></div>
    </section>

    <div className="grid gap-4 lg:grid-cols-[1.25fr_.9fr]">
      <section><SectionTitle title="Today’s flow" action="View full day" to="/activity" /><Panel className="overflow-hidden p-0"><div className="divide-y divide-border">{[['09:00','Focus time','Design system review','Focus'],['11:00','Delivery window','Market items to Osu','Request'],['13:00','Lunch break','Keep the afternoon light','Personal'],['15:00','Design review','Share updated mockups','Work'],['18:30','Call Mum','Personal time','People']].slice(0, showAllFlow ? 5 : 4).map(([time,title,detail,kind]) => <FlowEvent key={time} time={time} title={title} detail={detail} kind={kind} />)}</div><button type="button" onClick={() => setShowAllFlow(v => !v)} className="w-full border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground hover:bg-elevated/60">{showAllFlow ? "Show less" : "Show later"}</button></Panel></section>
      <section><SectionTitle title="Continue conversation" action="Open chat" to="/chat" /><Panel className="h-full p-5"><div className="flex items-start gap-3"><IconTile className="bg-[#f4e6dc] text-[#765443]"><MessageCircle className="size-4" /></IconTile><div className="min-w-0 flex-1"><p className="text-[14px] font-medium">Kurukoo</p><p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{recentMessage?.text ?? "Your conversations and requests stay together here, ready when you return."}</p></div></div><Link to="/chat" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:opacity-90">Continue <ArrowUpRight className="size-3.5" /></Link></Panel></section>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <section><SectionTitle title="Active requests" action="View all" to="/work" /><Panel className="p-0"><div className="divide-y divide-border">{active.length ? active.map((item) => <ActiveRequestRow key={item.id} title={item.title} detail={item.detail} timing={item.updated} status={<StatusPill tone={item.stage === "needs_you" ? "peach" : "green"}>{item.stage === "needs_you" ? "Needs you" : "Working"}</StatusPill>} />) : <div className="px-4 py-5 text-[13px] text-muted-foreground">Nothing is in progress. Start with a request above.</div>}</div><Link to="/work" className="block border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground hover:bg-elevated/60">View all requests <ArrowUpRight className="ml-1 inline size-3" /></Link></Panel></section>
      <section><SectionTitle title="Tasks & reminders" action="View all" to="/activity" /><Panel className="p-0"><div className="divide-y divide-border">{[['Share updated mockups','Today, 15:00',true],['Reply to Kojo','Today, 17:00',false],['Pick up groceries','Tomorrow',false]].map(([title,time,done]) => <button type="button" key={String(title)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-elevated/50"><span className={cn("grid size-5 place-items-center rounded-full border",done ? "border-transparent bg-primary text-primary-foreground" : "border-border")}>{done && <Check className="size-3" />}</span><span className={cn("min-w-0 flex-1 text-[13.5px]",done && "text-muted-foreground line-through")}>{title}</span><span className="shrink-0 text-[11.5px] text-muted-foreground">{time}</span></button>)}</div><button type="button" className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground hover:bg-elevated/60"><Plus className="size-3.5" />Add reminder</button></Panel></section>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Panel className="p-4"><SectionTitle title="Opportunity radar" action="Explore" to="/explore" /><IconTile className="bg-[#edf2e9] text-[#55705a]"><Gift className="size-4" /></IconTile><p className="mt-3 text-[13.5px] font-medium">Local design meetup</p><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">A new event near Osu matches your interests.</p><Link to="/explore" className="mt-3 inline-block text-[12px] font-medium">Review →</Link></Panel>
      <Panel className="p-4"><SectionTitle title="Points" action="View points" to="/wallet" /><p className="text-[27px] font-semibold tracking-tight">1,240</p><p className="mt-0.5 text-[12px] text-muted-foreground">+80 this week</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-elevated"><div className="h-full w-[68%] rounded-full bg-primary" /></div><p className="mt-2 text-[11px] text-muted-foreground">260 to next level</p></Panel>
      <Panel className="p-4"><SectionTitle title="Topics for you" action="Explore topics" to="/topics" /><div className="mt-1 flex flex-wrap gap-1.5"><span className="rounded-full bg-elevated px-2.5 py-1 text-[11px]">Design</span><span className="rounded-full bg-elevated px-2.5 py-1 text-[11px]">Accra</span><span className="rounded-full bg-elevated px-2.5 py-1 text-[11px]">AI</span><span className="rounded-full bg-elevated px-2.5 py-1 text-[11px]">Mobility</span></div><Link to="/topics" className="mt-4 inline-block text-[12px] font-medium">Explore topics →</Link></Panel>
      <Panel className="p-4"><SectionTitle title="Guide videos" action="See guides" to="/explore" /><div className="relative overflow-hidden rounded-xl bg-elevated"><div className="flex aspect-[16/8] items-center justify-center"><CirclePlay className="size-8 text-muted-foreground" /></div><span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px]">2:14</span></div><p className="mt-3 text-[13px] font-medium">Get more from Kurukoo</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">A quick tour of handing things over.</p></Panel>
    </div>

    <section><SectionTitle title="Connected channels" action="Manage" to="/connect" /><Panel className="p-0"><div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex items-center gap-3 p-4"><IconTile><MessageCircle className="size-4" /></IconTile><div><p className="text-[13px] font-medium">Web chat</p><StatusPill tone="green">Connected</StatusPill></div></div><div className="flex items-center gap-3 p-4"><IconTile><Mic2 className="size-4" /></IconTile><div><p className="text-[13px] font-medium">WhatsApp</p><StatusPill>Not connected</StatusPill></div></div><div className="flex items-center gap-3 p-4"><IconTile><Users className="size-4" /></IconTile><div><p className="text-[13px] font-medium">Telegram</p><StatusPill>Not connected</StatusPill></div></div></div></Panel></section>
    <p className="pb-4 text-center text-[11px] text-muted-foreground">Kurukoo keeps you in control. Nothing is committed without your approval.</p>
  </div>;
}
