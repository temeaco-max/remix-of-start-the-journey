import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, CircleAlert, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { SurfaceNext } from "@/components/kurukoo/surface-next";
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

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function FieldDashboard() {
  const { work: localWork, notifications } = useKurukoo();
  const configured = isKurukooApiConfigured();
  const [requests, setRequests] = useState<EconomicRequest[]>([]);
  const [pulse, setPulse] = useState<PulseReadiness | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!configured) return;
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
    const timer = configured ? window.setInterval(() => void load(), 10000) : undefined;
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
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
    <div className="min-w-0 space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[28px] border border-border bg-surface px-5 py-7 md:px-8 md:py-9">
        <div className="pointer-events-none absolute -right-24 -top-28 size-[320px] rounded-full bg-brand-tint/35 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-3.5" /></span>
              Your field
            </div>
            <h1 className="mt-3 text-[42px] font-semibold leading-[.96] tracking-[-0.055em] md:text-[60px]">{greeting(now.getHours())}.<br /><span className="text-muted-foreground/70">Get going.</span></h1>
            <p className="mt-4 max-w-xl text-[13px] leading-6 text-muted-foreground">Kurukoo keeps the conversation, ongoing work, context and next steps together so you can move through your day without rebuilding the story.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 text-[10.5px] text-muted-foreground sm:min-w-[300px]">
            <div className="rounded-2xl border border-border bg-background/70 p-3"><CalendarDays className="size-3.5" /><p className="mt-2 font-medium text-foreground">{now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><p className="mt-0.5">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p></div>
            <Link to="/activity" className="rounded-2xl border border-border bg-background/70 p-3 transition-colors hover:bg-elevated"><Bell className="size-3.5" /><p className="mt-2 font-medium text-foreground">{unread ? `${unread} need your attention` : "Nothing new"}</p><p className="mt-0.5">Open Activity</p></Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-background p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your assistant</p><h2 className="mt-1 text-[17px] font-semibold">What needs your attention?</h2></div>
          <Link to="/chat" className="hidden items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground sm:inline-flex">Open Chat <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="rounded-[22px] border border-border bg-surface p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="size-4" /></span><div className="min-w-0"><p className="text-[13px] font-medium">Tell Kurukoo what you want to move forward.</p><p className="mt-0.5 text-[10.5px] text-muted-foreground">Ask a question, continue a task, or start something new.</p></div></div>
            <AskKurukoo prompt="What needs my attention today?" className="bg-background" />
          </div>
        </div>
      </section>

      {error ? <div className="flex items-start gap-2 rounded-2xl border border-border bg-elevated/40 px-4 py-3 text-[10.5px] text-muted-foreground"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />Live Field data could not be refreshed. No new provider, payment or execution state is being inferred.</div> : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.8fr)]">
        <div className="overflow-hidden rounded-[24px] border border-border bg-background">
          <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active requests</p><h2 className="mt-1.5 text-[19px] font-semibold tracking-[-0.025em]">Work in motion</h2></div><Link to="/work" className="text-[10.5px] font-medium text-muted-foreground hover:text-foreground">View all</Link></div>
          {loading ? <div className="space-y-2 p-5" aria-label="Loading active Work"><div className="h-12 animate-pulse rounded-xl bg-elevated" /><div className="h-12 animate-pulse rounded-xl bg-elevated" /><div className="h-12 animate-pulse rounded-xl bg-elevated" /></div> : active.length ? <div className="divide-y divide-border/70">{active.map((item) => <Link key={item.id} to="/work/$workId" params={{ workId: item.id }} className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border"><CheckCircle2 className="size-3.5 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-medium">{item.title}</p><p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{item.detail}</p></div><span className="hidden text-[9.5px] text-muted-foreground sm:block">{item.updated}</span><ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" /></Link>)}</div> : <div className="px-5 py-9"><p className="text-[12px] font-medium">Nothing is in motion yet.</p><p className="mt-1 text-[10.5px] leading-5 text-muted-foreground">Start in Chat and Kurukoo will move an execution request into Work when the task needs coordination.</p><AskKurukoo prompt="Help me get something done today" className="mt-4 bg-background" /></div>}
          {needsYou.length ? <div className="border-t border-border bg-elevated/25 px-5 py-3 text-[10.5px] text-muted-foreground"><span className="font-medium text-foreground">{needsYou.length} need{needsYou.length === 1 ? "s" : ""} you.</span> Open Work to review the next decision.</div> : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-border bg-background p-5">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Today’s flow</p><h2 className="mt-1.5 text-[18px] font-semibold">What happens next</h2></div><Link to="/activity" className="text-[10px] text-muted-foreground hover:text-foreground">Activity</Link></div>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3"><span className="mt-0.5 size-2 rounded-full bg-primary" /><div><p className="text-[11.5px] font-medium">Conversation</p><p className="mt-0.5 text-[10px] text-muted-foreground">Start or continue with Kurukoo.</p></div></div>
              <div className="flex gap-3"><span className="mt-0.5 size-2 rounded-full border border-primary" /><div><p className="text-[11.5px] font-medium">Work</p><p className="mt-0.5 text-[10px] text-muted-foreground">Review options, approvals and progress when execution is required.</p></div></div>
              <div className="flex gap-3"><span className="mt-0.5 size-2 rounded-full border border-border" /><div><p className="text-[11.5px] font-medium">Continuity</p><p className="mt-0.5 text-[10px] text-muted-foreground">Evidence and outcomes return to Chat, Activity and Memory.</p></div></div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-background p-5">
            <div className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agent-assisted next steps</p><h2 className="mt-1 text-[16px] font-semibold">Kurukoo can keep going</h2></div></div>
            <p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">Agents work inside the same request and permission boundaries. You stay in control of consequential actions.</p>
            <Link to="/agents" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">See Agents <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-background p-5"><div className="flex items-center gap-2"><Users className="size-3.5" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trusted people</p><h2 className="mt-1 text-[16px] font-semibold">People you choose to keep close</h2></div></div><p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">Trusted contacts and communication remain governed by your existing identity, consent and messaging controls.</p><Link to="/contacts" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Manage trusted people <ArrowRight className="size-3.5" /></Link></div>
        <div className="rounded-[24px] border border-border bg-background p-5"><div className="flex items-center gap-2"><MapPin className="size-3.5" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nearby pulse</p><h2 className="mt-1 text-[16px] font-semibold">Local signals, truthfully</h2></div></div><p className="mt-3 text-[10.5px] leading-5 text-muted-foreground">{pulse?.active ? "Your Nearby Pulse presence is active." : pulse?.eligibleToBroadcast ? "Nearby Pulse is available when you choose to broadcast." : "Nearby Pulse availability depends on current account/provider readiness."}</p><Link to="/discover" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Nearby <ArrowRight className="size-3.5" /></Link></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-surface p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-3.5" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Safety state</p></div><p className="mt-3 text-[15px] font-semibold">Your controls stay in charge.</p><p className="mt-1.5 text-[10.5px] leading-5 text-muted-foreground">Authentication, consent, authorization and evidence boundaries remain with their canonical owners.</p><Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Review Trust <ArrowRight className="size-3.5" /></Link></div>
        <div className="rounded-[24px] border border-border bg-surface p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Task focus</p><p className="mt-3 text-[15px] font-semibold">One assistant, many surfaces.</p><p className="mt-1.5 text-[10.5px] leading-5 text-muted-foreground">Chat starts the work. Work coordinates it. Activity keeps the story. Memory carries approved context. Artifacts hold durable outputs.</p><Link to="/chat" className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Continue in Chat <ArrowRight className="size-3.5" /></Link></div>
      </section>

      <section><div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Continue from here</p><h2 className="mt-1 text-[18px] font-semibold">Your Kurukoo</h2></div><SurfaceNext /></section>
    </div>
  );
}
