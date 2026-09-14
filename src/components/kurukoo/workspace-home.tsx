import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleAlert, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useKurukoo } from "@/lib/kurukoo-store";
import { fetchEconomicRequests, isKurukooApiConfigured, type EconomicRequest } from "@/lib/kurukoo-api";
import { canonicalWorkItem } from "@/lib/work-projection";
import { SurfaceNext } from "@/components/kurukoo/surface-next";

export function WorkspaceHome() {
  const { work: localWork } = useKurukoo();
  const configured = isKurukooApiConfigured();
  const [requests, setRequests] = useState<EconomicRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const load = async () => {
      try {
        const next = await fetchEconomicRequests();
        if (!cancelled) {
          setRequests(next);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to refresh your active work.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [configured]);

  const activeRequests = useMemo(
    () => requests.filter((request) => !["completed", "cancelled", "abandoned", "disputed", "failed"].includes(request.status)),
    [requests],
  );
  const needsYouRequests = useMemo(
    () => activeRequests.filter((request) => ["awaiting_approval", "awaiting_payment", "awaiting_confirmation"].includes(request.status)),
    [activeRequests],
  );
  const active = configured
    ? activeRequests.slice(0, 5).map(canonicalWorkItem)
    : localWork.filter((item) => item.stage !== "done").slice(0, 5);
  const needsYou = configured
    ? needsYouRequests.length
    : active.filter((item) => item.stage === "needs_you").length;

  return <div className="min-w-0 space-y-10 pb-10">
    <section className="relative overflow-hidden border-b border-border/80 pb-8 pt-2 md:pb-10">
      <div className="pointer-events-none absolute -right-24 -top-28 size-[360px] rounded-full bg-brand-tint/35 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-3" /></span>Your Perch</div>
          <h1 className="mt-4 max-w-3xl text-[44px] font-semibold leading-[.96] tracking-[-0.055em] md:text-[62px]">Your Kurukoo,<br /><span className="text-muted-foreground/75">around the work.</span></h1>
          <p className="mt-5 max-w-2xl text-[14px] leading-7 text-muted-foreground">A quiet personal place for seeing what Kurukoo is handling, checking what needs you, and returning to the conversation.</p>
          <Link to="/chat" className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold hover:text-primary">Continue with Kurukoo <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="border-l border-border/80 pl-5 lg:mb-1"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Your control</p><p className="mt-2 text-[13px] leading-6">Kurukoo can move things forward, but consequential actions remain yours to approve.</p><Link to="/memory" className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium hover:text-primary">Review trusted context <ArrowRight className="size-3.5" /></Link></div>
      </div>
    </section>

    <section className="grid gap-px overflow-hidden border border-border/80 bg-border/80 md:grid-cols-3">
      <Link to="/chat" className="group bg-background p-5 transition-colors hover:bg-surface"><MessageCircle className="size-4 text-muted-foreground" /><p className="mt-9 text-[14px] font-semibold">Continue the conversation</p><p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">Tell Kurukoo what needs doing. This is the main path for getting something moving.</p><span className="mt-5 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Chat <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>
      <Link to="/work" className="group bg-background p-5 transition-colors hover:bg-surface"><CheckCircle2 className="size-4 text-muted-foreground" /><p className="mt-9 text-[14px] font-semibold">See what is being handled</p><p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">{active.length ? `${active.length} active ${active.length === 1 ? "item" : "items"}${needsYou ? ` · ${needsYou} need${needsYou === 1 ? "s" : ""} you` : ""}.` : "Nothing is currently in motion."}</p><span className="mt-5 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Work <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>
      <Link to="/memory" className="group bg-background p-5 transition-colors hover:bg-surface"><ShieldCheck className="size-4 text-muted-foreground" /><p className="mt-9 text-[14px] font-semibold">Check your context</p><p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">Review the details Kurukoo has retained. They support continuity, not permission to act.</p><span className="mt-5 inline-flex items-center gap-1 text-[10.5px] font-medium">Review context <ArrowRight className="size-3.5" /></span></Link>
    </section>

    {error ? <div className="flex items-start gap-2 border border-border bg-elevated/35 px-4 py-3 text-[10.5px] text-muted-foreground"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />Live Work could not be refreshed. Showing the last known local view without inventing a new state.</div> : null}

    {active.length ? <section className="overflow-hidden border border-border/80">
      <div className="flex items-end justify-between gap-4 border-b border-border/80 px-5 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">In motion</p><h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.02em]">Things Kurukoo is handling</h2></div><Link to="/work" className="text-[10.5px] font-medium text-muted-foreground hover:text-foreground">View all Work</Link></div>
      <div className="divide-y divide-border/70">{active.map((item) => <Link key={item.id} to="/work/$workId" params={{ workId: item.id }} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface"><span className="grid size-8 shrink-0 place-items-center border border-border bg-background"><CheckCircle2 className="size-3.5 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{item.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.detail}</p></div><span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:block">{item.updated}</span><ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" /></Link>)}</div>
    </section> : <section className="border border-border/80 px-5 py-8"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nothing in motion</p><h2 className="mt-2 text-[27px] font-semibold tracking-[-0.035em]">Tell Kurukoo what you want to move forward.</h2><Link to="/chat" className="mt-5 inline-flex items-center gap-1.5 bg-primary px-4 py-2.5 text-[11px] font-medium text-primary-foreground">Start with Kurukoo <ArrowRight className="size-3.5" /></Link></section>}

    <section>
      <div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Continue from here</p><h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.025em]">The rest of Kurukoo</h2><p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">Move from conversation into discovery, agents, artifacts or local signals when the task calls for it.</p></div>
      <SurfaceNext />
    </section>
  </div>;
}
