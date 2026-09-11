import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDot, Compass, FileCheck2, LockKeyhole, MessageCircle, Sparkles, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchExecutionOverview, type ExecutionOverview } from "@/lib/execution-api";
import { useKurukoo } from "@/lib/kurukoo-store";
import { Panel } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/work")({
  head: () => ({ meta: [{ title: "Work — Kurukoo" }, { name: "description", content: "Everything Kurukoo is doing, waiting on, and has completed." }] }),
  component: WorkPage,
});

const loopLabels: Record<string, string> = { tell: "Tell", understand: "Understand", find_or_plan: "Find / plan", choose: "Choose", approve: "Approve", do: "Do", show_proof: "Show proof", done: "Done" };

function WorkPage() {
  const { work } = useKurukoo();
  const [overview, setOverview] = useState<ExecutionOverview | null>(null);
  useEffect(() => { void fetchExecutionOverview().then(setOverview); }, []);
  const active = work.filter(item => item.stage !== "done");
  const completed = work.filter(item => item.stage === "done");

  return <div className="min-w-0 space-y-5 pb-10">
    <header className="max-w-4xl pt-3 md:pt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Execution control centre</p>
      <h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em]">Everything Kurukoo is doing for you.</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">See active work, decisions, proof and completed outcomes. You do not need to know which agent, provider, API or service Kurukoo used.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <Panel className="p-4"><p className="text-[11px] text-muted-foreground">In progress</p><p className="mt-1 text-2xl font-semibold">{active.length}</p><p className="mt-1 text-[11px] text-muted-foreground">Work currently moving.</p></Panel>
      <Panel className="p-4"><p className="text-[11px] text-muted-foreground">Needs you</p><p className="mt-1 text-2xl font-semibold">{active.filter(item => item.stage === "needs_you").length}</p><p className="mt-1 text-[11px] text-muted-foreground">Decisions or information required.</p></Panel>
      <Panel className="p-4"><p className="text-[11px] text-muted-foreground">Completed</p><p className="mt-1 text-2xl font-semibold">{completed.length}</p><p className="mt-1 text-[11px] text-muted-foreground">Outcomes already recorded.</p></Panel>
    </section>

    {active.length ? <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold">Active work</h2><Link to="/chat" search={{ prompt: "Show me everything Kurukoo is working on" } as never} className="text-[11.5px] font-medium text-primary">Ask Kurukoo</Link></div><div className="grid gap-3 lg:grid-cols-2">{active.map(item => <Link key={item.id} to={(`/work/${item.id}`) as never} className="group rounded-[18px] border border-border bg-surface p-4 transition hover:bg-elevated"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink">{item.stage === "needs_you" ? <LockKeyhole className="size-4" /> : <CircleDot className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="text-[13.5px] font-semibold">{item.title}</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{item.detail}</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" /></div><div className="mt-3 flex items-center gap-2 text-[10.5px] text-muted-foreground"><span className="rounded-full bg-elevated px-2 py-1">{item.stage === "needs_you" ? "Needs you" : "Working"}</span><span>{item.updated}</span></div></div></div></Link>)}</div></section> : <Panel className="p-8 text-center"><Sparkles className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-3 text-[15px] font-semibold">Nothing is waiting.</h2><p className="mx-auto mt-1 max-w-md text-[12px] text-muted-foreground">Start with an outcome and Kurukoo will work out the route.</p><Link to="/chat" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground">Tell Kurukoo what needs doing <ArrowRight className="size-3.5" /></Link></Panel>}

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Panel className="overflow-hidden p-0"><div className="border-b border-border px-4 py-4"><div className="flex items-center gap-2"><Workflow className="size-4 text-muted-foreground" /><h2 className="text-[14px] font-semibold">One execution loop</h2></div><p className="mt-1 text-[11.5px] text-muted-foreground">The same model handles digital, physical and hybrid work.</p></div><div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">{(overview?.executionLoop ?? Object.keys(loopLabels)).map((step, index, list) => <div key={step} className="bg-surface p-3"><span className="text-[10px] text-muted-foreground">0{index + 1}</span><p className="mt-1 text-[12px] font-medium">{loopLabels[step] ?? step}</p>{index < list.length - 1 ? <p className="mt-1 text-[10px] text-muted-foreground">→ next</p> : <p className="mt-1 text-[10px] text-muted-foreground">outcome</p>}</div>)}</div></Panel>
      <Panel className="p-4"><div className="flex items-center gap-2"><FileCheck2 className="size-4 text-muted-foreground" /><h2 className="text-[14px] font-semibold">Proof, not promises</h2></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">A completion should be backed by the strongest evidence actually available. Kurukoo should never turn an indicative result, database row or unverified provider claim into a false “done”.</p><div className="mt-4 grid gap-2 text-[11px]"><div className="flex items-center gap-2"><CheckCircle2 className="size-3.5" />Evidence attached where available</div><div className="flex items-center gap-2"><LockKeyhole className="size-3.5" />Consent before consequential actions</div><div className="flex items-center gap-2"><MessageCircle className="size-3.5" />Context stays with the work</div></div></Panel>
    </section>

    <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Choose the route</h2><p className="text-[11.5px] text-muted-foreground">Kurukoo can use whichever execution mode fits the outcome.</p></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{(overview?.modes ?? []).map(mode => <Link key={mode.id} to="/chat" search={{ prompt: mode.prompt } as never} className="group rounded-[18px] border border-border bg-surface p-4 hover:bg-elevated"><div className="flex items-center justify-between"><span className="rounded-xl bg-elevated p-2"><Compass className="size-4" /></span><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div><h3 className="mt-4 text-[13.5px] font-semibold">{mode.title}</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{mode.description}</p></Link>)}</div></section>

    <section className="rounded-[20px] border border-border bg-elevated/45 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kurukoo operating surface</p><h2 className="mt-1 text-[16px] font-semibold">Move from intention to outcome.</h2></div><Link to="/chat" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground">Start something <ArrowRight className="size-3.5" /></Link></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(overview?.surfaceGroups ?? []).map(surface => <Link key={surface.id} to={surface.path as never} className="rounded-xl border border-border bg-surface p-3 hover:bg-elevated"><p className="text-[12px] font-semibold">{surface.title}</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{surface.description}</p></Link>)}</div></section>
  </div>;
}
