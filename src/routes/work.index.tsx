import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Clock3, ListChecks, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { WorkItemCard } from "@/components/kurukoo/primitives";
import { DirectoryStateBadge } from "@/components/kurukoo/surface-directory";
import { Panel } from "@/components/kurukoo/ui";
import { fetchEconomicRequests, isKurukooApiConfigured, type EconomicRequest } from "@/lib/kurukoo-api";
import { fetchExecutionNetworkContract, summarizeExecutionNetwork, type ExecutionNetworkContract } from "@/lib/execution-network-api";
import { useKurukoo, type WorkItem } from "@/lib/kurukoo-store";
import { canonicalWorkItem } from "@/lib/work-projection";

export const Route = createFileRoute("/work/")({
  head: () => ({
    meta: [
      { title: "Work — Kurukoo" },
      { name: "description", content: "Everything Kurukoo is handling for you, and what it needs from you." },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const { work: localWork, advance } = useKurukoo();
  const configured = isKurukooApiConfigured();
  const [requests, setRequests] = useState<EconomicRequest[]>([]);
  const [network, setNetwork] = useState<ExecutionNetworkContract | null>(null);
  const [loading, setLoading] = useState(configured);
  const [networkLoading, setNetworkLoading] = useState(configured);
  const [error, setError] = useState("");

  const refresh = () => {
    if (!configured) return;
    setLoading(true);
    setError("");
    void fetchEconomicRequests()
      .then(setRequests)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your requests."))
      .finally(() => setLoading(false));
  };

  const refreshNetwork = () => {
    if (!configured) return;
    setNetworkLoading(true);
    void fetchExecutionNetworkContract()
      .then(setNetwork)
      .catch(() => setNetwork(null))
      .finally(() => setNetworkLoading(false));
  };

  useEffect(() => {
    refresh();
    refreshNetwork();
  }, [configured]);

  const items: WorkItem[] = useMemo(() => (configured ? requests.map(canonicalWorkItem) : localWork), [configured, localWork, requests]);
  const active = items.filter((item) => item.stage !== "done");
  const needsYou = items.filter((item) => item.stage === "needs_you");
  const completed = items.filter((item) => item.stage === "done");
  const networkSummary = network ? summarizeExecutionNetwork(network) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Work" subtitle="What Kurukoo is taking care of right now." />

      <section className="relative overflow-hidden rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-brand-tint/60 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink">
            <Sparkles className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-medium text-muted-foreground">Kurukoo at work</p>
              <DirectoryStateBadge state={configured ? "live" : "example"} />
            </div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">You stay in control. Kurukoo carries the work.</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              Requests move here as they are understood, coordinated and completed. Anything requiring your approval is clearly marked.
            </p>
          </div>
          {configured ? (
            <button type="button" onClick={() => { refresh(); refreshNetwork(); }} disabled={loading || networkLoading} aria-label="Refresh Work" className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-elevated disabled:opacity-50">
              <RefreshCw className={`size-4 ${loading || networkLoading ? "animate-spin" : ""}`} />
            </button>
          ) : null}
        </div>
      </section>

      {networkSummary ? (
        <section className="rounded-[20px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">Execution Network</p>
              <h2 className="mt-0.5 text-[16px] font-semibold tracking-tight">{networkSummary.total} canonical execution pillars</h2>
            </div>
            <span className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] text-muted-foreground">Contract v{network?.contractVersion}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-elevated/60 p-3"><p className="text-[10px] text-muted-foreground">Implemented</p><p className="mt-1 text-lg font-semibold">{networkSummary.implemented}</p></div>
            <div className="rounded-xl bg-elevated/60 p-3"><p className="text-[10px] text-muted-foreground">Plumbed</p><p className="mt-1 text-lg font-semibold">{networkSummary.plumbed}</p></div>
            <div className="rounded-xl bg-elevated/60 p-3"><p className="text-[10px] text-muted-foreground">External activation</p><p className="mt-1 text-lg font-semibold">{networkSummary.external_activation_required}</p></div>
          </div>
          <p className="mt-3 text-[10.5px] text-muted-foreground">Repository readiness is not presented as proof that an external provider, payment, dispatch or fulfilment event is live.</p>
        </section>
      ) : configured && !networkLoading ? (
        <section className="rounded-xl border border-dashed border-border bg-elevated/35 px-4 py-3 text-[10.5px] text-muted-foreground">Execution Network contract is not connected yet. Work remains usable through the canonical request service.</section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><ListChecks className="size-4" /><span className="text-[12px]">In progress</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{active.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Requests being handled</p></Panel>
        <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" /><span className="text-[12px]">Needs you</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{needsYou.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Waiting for approval or input</p></Panel>
        <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="size-4" /><span className="text-[12px]">Completed</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{completed.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Finished requests</p></Panel>
      </div>

      {error ? <div className="rounded-xl border border-border bg-elevated/50 px-4 py-3 text-[11px] text-muted-foreground">{error}<button type="button" onClick={refresh} className="ml-2 font-medium underline">Try again</button></div> : null}
      {loading ? <Panel className="p-6 text-center text-[11.5px] text-muted-foreground">Loading your requests…</Panel> : items.length === 0 ? <EmptyState title="Nothing in flight" body={configured ? "You have no requests in the canonical request service yet." : "Ask Kurukoo for something on Home and it will show up here as it makes progress."} /> : <section><div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold tracking-tight">Your requests</h2><span className="text-[12px] text-muted-foreground">{items.length} total</span></div><ul className="space-y-3">{items.map((item) => <li key={item.id}><WorkItemCard item={item} onAdvance={configured ? undefined : advance} /><div className="mt-1 flex justify-end"><Link to="/work/$workId" params={{ workId: item.id }} className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground">Open request <ArrowUpRight className="size-3.5" /></Link></div></li>)}</ul></section>}
      {!configured ? <div className="rounded-xl border border-dashed border-border bg-elevated/35 px-3.5 py-2.5 text-[10.5px] text-muted-foreground">Development preview: example Work items are local-only. They do not represent external completion.</div> : null}
    </div>
  );
}
