import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, CircleAlert, Clock3, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { useKurukoo } from "@/lib/kurukoo-store";
import { fetchEconomicRequests, fetchPulseReadiness, isKurukooApiConfigured, type EconomicRequest, type PulseReadiness } from "@/lib/kurukoo-api";
import { canonicalWorkItem } from "@/lib/work-projection";

const terminalStatuses = new Set(["completed", "cancelled", "abandoned", "disputed", "failed"]);
const attentionStatuses = new Set(["awaiting_approval", "awaiting_payment", "awaiting_confirmation"]);

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function FieldCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-border bg-background ${className}`}>{children}</section>;
}

export function FieldDashboard() {
  const { work: localWork, notifications } = useKurukoo();
  const configured = isKurukooApiConfigured();
  const [requests, setRequests] = useState<EconomicRequest[]>([]);
  const [pulse, setPulse] = useState<PulseReadiness | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [next, readiness] = await Promise.all([fetchEconomicRequests(), fetchPulseReadiness()]);
        if (!cancelled) {
          setRequests(next);
          setPulse(readiness);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Your live Field could not be refreshed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [configured]);

  const active = useMemo(() => {
    if (configured) return requests.filter((request) => !terminalStatuses.has(request.status)).map(canonicalWorkItem).slice(0, 6);
    return localWork.filter((item) => item.stage !== "done").slice(0, 6);
  }, [configured, localWork, requests]);

  const needsYou = useMemo(() => {
    if (configured) return requests.filter((request) => attentionStatuses.has(request.status));
    return localWork.filter((item) => item.stage === "needs_you");
  }, [configured, localWork, requests]);

  const now = new Date();
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="min-w-0 space-y-6 pb-10 md:space-y-7">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-surface px-5 py-7 md:px-8 md:py-9">
        <div className="pointer-events-none absolute -right-24 -top-28 size-[320px] rounded-full bg-brand-tint/35 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground"><span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-3.5" /></span>Your field</div>
            <h1 className="mt-3 text-[42px] font-semibold leading-[.96] tracking-[-0.055em] md:text-[60px]">{greeting(now.getHours())}.<br /><span className="text-muted-foreground/70">Get going.</span></h1>
            <p className="mt-4 max-w-xl text-[13px] leading-6 text-muted-foreground">Your current world, what needs attention, and what Kurukoo is already moving forward.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 text-[10.5px] sm:min-w-[310px]">
            <div className="rounded-2xl border border-border bg-background/75 p-3"><CalendarDays className="size-3.5 text-muted-foreground" /><p className="mt-2 font-medium">{now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><p className="mt-0.5 text-muted-foreground">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p></div>
            <Link to="/activity" className="rounded-2xl border border-border bg-background/75 p-3 transition-colors hover:bg-elevated"><Bell className="size-3.5 text-muted-foreground" /><p className="mt-2 font-medium">{unread ? `${unread} need your attention` : "You are up to date"}</p><p className="mt-0.5 text-muted-foreground">Open Activity</p></Link>
          </div>
        </div>
      </section>

      <FieldCard className="overflow-hidden shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-5 py-4 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your assistant</p><h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">What needs your attention?</h2></div>
        <div className="p-4 md:p-5"><div className="rounded-[22px] border border-border bg-surface p-4 md:p-5"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">Tell Kurukoo what needs to happen.</p><p className="mt-0.5 text-[10.5px] text-muted-foreground">Ask, decide, coordinate or get something done.</p></div><Link to="/chat" className="hidden items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground sm:inline-flex">Open Chat <ArrowRight className="size-3.5" /></Link></div><div className="mt-4 flex flex-wrap items-center gap-2"><AskKurukoo prompt="What needs my attention today?" className="bg-background" /><AskKurukoo prompt="Help me plan what needs doing today" className="bg-background">Plan my day</AskKurukoo></div></div></div>
      </FieldCard>

      {error ? <div role="alert" className="flex items-start gap-2 rounded-2xl border border-border bg-elevated/40 px-4 py-3 text-[10.5px] text-muted-foreground"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />Live Field data could not be refreshed. No provider, payment or execution state is being inferred.</div> : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.8fr)]">
        <FieldCard className="overflow-hidden"><div className="flex items-end justify-between gap-4 border-b border-border px-5 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active requests</p><h2 className="mt-1.5 text-[19px] font-semibold tracking-[-0.025em]">Work in motion</h2></div><Link to="/work" className="text-[10.5px] font-medium text-muted-foreground hover:text-foreground">View all</Link></div>{loading ? <div className="space-y-2 p-5" aria-label="Loading Work"><div className="h-12 animate-pulse rounded-xl bg-elevated" /><div className="h-12 animate-pulse rounded-xl bg-elevated" /><div className="h-12 animate-pulse rounded-xl bg-elevated" /></div> : active.length ? <div className="divide-y divide-border/70">{active.map((item) => <Link key={item.id} to="/work/$workId" params={{ workId: item.id }} className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border"><CheckCircle2 className="size-3.5 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-medium">{item.title}</p><p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{item.detail}</p></div><span className="hidden text-[9.5px] text-muted-foreground sm:block">{item.updated}</span><ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" /></Link>)}</div> : <div className="px-5 py-8"><p className="text-[12px] font-medium">Nothing is in motion yet.</p><p className="mt-1 text-[10.5px] leading-5 text-muted-foreground">Start in Chat when you want Kurukoo to coordinate something that belongs in Work.</p><AskKurukoo prompt="Help me get something done today" className="mt-4 bg-background" /></div>}{needsYou.length ? <div className="flex items-center justify-between gap-3 border-t border-border bg-elevated/25 px-5 py-3 text-[10.5px]"><span><span className="font-medium">{needsYou.length} need{needsYou.length === 1 ? "s" : ""} you.</span> A decision or confirmation is waiting.</span><Link to="/activity" className="font-medium hover:underline">Review</Link></div> : null}</FieldCard>

        <div className="space-y-4"><FieldCard className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Today’s flow</p><h2 className="mt-1.5 text-[18px] font-semibold">Conversation → Work → outcome</h2></div><Link to="/activity" className="text-[10px] text-muted-foreground hover:text-foreground">Activity</Link></div><div className="mt-5 space-y-4"><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /><div><p className="text-[11.5px] font-medium">Conversation</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Tell Kurukoo what you want and keep the context.</p></div></div><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full border border-primary" /><div><p className="text-[11.5px] font-medium">Work</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Review options, approvals, progress and evidence.</p></div></div><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full border border-border" /><div><p className="text-[11.5px] font-medium">Continuity</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Activity, Memory and Artifacts carry the result forward.</p></div></div></div></FieldCard><FieldCard className="p-5"><div className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agent-assisted next steps</p><h2 className="mt-1 text-[16px] font-semibold">Keep going without losing control</h2></div></div><p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">Agents can continue work inside the same request and permission boundaries. Consequential actions still return to you when required.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/agents" className="inline-flex items-center gap-1 text-[10.5px] font-medium">Open Agents <ArrowRight className="size-3.5" /></Link><Link to="/work" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">See Work <ArrowRight className="size-3.5" /></Link></div></FieldCard></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2"><FieldCard className="p-5"><div className="flex items-center gap-2"><Users className="size-3.5" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trusted people</p><h2 className="mt-1 text-[16px] font-semibold">People you choose to keep close</h2></div></div><p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">Your relationships stay connected to consent, identity and communication controls. No contacts are invented when the live people source is unavailable.</p><Link to="/contacts" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Open trusted people <ArrowRight className="size-3.5" /></Link></FieldCard><FieldCard className="p-5"><div className="flex items-center gap-2"><MapPin className="size-3.5" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nearby pulse</p><h2 className="mt-1 text-[16px] font-semibold">Local context when it is available</h2></div></div><p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">{pulse?.active ? "Your Nearby Pulse presence is active." : pulse?.eligibleToBroadcast ? "You can choose to broadcast availability." : "Nearby Pulse is waiting on the canonical readiness boundary."}</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/discover" className="inline-flex items-center gap-1 text-[10.5px] font-medium">Open Nearby <ArrowRight className="size-3.5" /></Link><Link to="/connect" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">Connect <ArrowRight className="size-3.5" /></Link></div></FieldCard></section>

      <section className="grid gap-4 md:grid-cols-2"><FieldCard className="bg-surface p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-3.5" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Safety state</p></div><p className="mt-3 text-[15px] font-semibold">Trust and permissions remain explicit.</p><p className="mt-1.5 text-[10.5px] leading-5 text-muted-foreground">Kurukoo does not turn an unavailable or unverified external state into an “all good” claim.</p><Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Review Trust <ArrowRight className="size-3.5" /></Link></FieldCard><FieldCard className="bg-surface p-5"><div className="flex items-center gap-2"><Clock3 className="size-3.5" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Task focus</p></div><p className="mt-3 text-[15px] font-semibold">{active[0]?.title ?? "Nothing is in motion"}</p><p className="mt-1.5 text-[10.5px] leading-5 text-muted-foreground">{active[0]?.detail ?? "When a request needs coordination, its canonical Work state will appear here."}</p><div className="mt-4 flex flex-wrap gap-2">{active[0] ? <Link to="/work/$workId" params={{ workId: active[0].id }} className="inline-flex items-center gap-1 text-[10.5px] font-medium">Open Work <ArrowRight className="size-3.5" /></Link> : null}<Link to="/chat" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">Continue in Chat <ArrowRight className="size-3.5" /></Link></div></FieldCard></section>

      {!configured ? <div className="rounded-2xl border border-dashed border-border bg-elevated/30 px-4 py-3 text-[10.5px] leading-5 text-muted-foreground">Development preview: the live backend is not configured in this frontend session. Local Work data may appear, but no external provider, payment, availability or fulfilment outcome is represented as real.</div> : null}
    </div>
  );
}
