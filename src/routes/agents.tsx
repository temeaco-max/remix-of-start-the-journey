import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bot, Clock3, Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AIProviderDirectory } from "@/components/kurukoo/ai-provider-directory";
import { AgentIntelligence } from "@/components/kurukoo/agent-intelligence";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { controlAgentGoal, fetchAgentGoals, type AgentGoal } from "@/lib/kurukoo-api";
import { capabilityCount, skillCategories } from "@/lib/skill-catalog";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "Agents — Kurukoo" }, { name: "description", content: "Run Kurukoo AI providers and control agent objectives." }] }),
  component: AgentsPage,
});

function GoalCard({ goal, onChange }: { goal: AgentGoal; onChange: (goal: AgentGoal | null) => void }) {
  const [busy, setBusy] = useState(false);
  const status = String(goal.status || "active").toLowerCase();
  const next = status === "paused" ? "resume" : status.match(/cancel|complete|done|stopped/) ? null : "pause";
  async function run(action: "pause" | "resume" | "cancel") {
    setBusy(true);
    try {
      const result = await controlAgentGoal(goal.id, action);
      onChange(result.goal ?? { ...goal, status: action === "pause" ? "paused" : action === "cancel" ? "cancelled" : "active" });
    } finally { setBusy(false); }
  }
  return <article className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated/40">
    <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Bot className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-[13.5px] font-semibold">{goal.objective || goal.skill || "Agent objective"}</h3><span className="rounded-full bg-elevated px-2 py-0.5 text-[9.5px]">{status.replace(/[_-]/g, " ")}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{goal.nextRunAt ? `Next run · ${new Date(goal.nextRunAt).toLocaleString()}` : "No scheduled check"}</p></div></div>
    <div className="mt-3 flex flex-wrap gap-2">{next ? <Action onClick={() => void run(next)} disabled={busy}>{next === "pause" ? <><Pause className="mr-1.5 size-3.5"/>Pause</> : <><Play className="mr-1.5 size-3.5"/>Resume</>}</Action> : null}{status !== "cancelled" && status !== "completed" ? <Action onClick={() => void run("cancel")} disabled={busy}><Square className="mr-1.5 size-3.5"/>Stop</Action> : null}{goal.conversationId ? <Link to="/chat" className={actionClass()}>Open conversation <ArrowUpRight className="ml-1 size-3.5"/></Link> : null}</div>
  </article>;
}

const quickJobs = ["Get me a ride", "Find a plumber", "Order food", "Repair my phone", "Pray with me", "Plan my day"];

function AgentsPage() {
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  useEffect(() => { void fetchAgentGoals().then(setGoals).catch(() => setGoals([])); }, []);
  return <div className="space-y-7">
    <PageHeader title="Agents" subtitle="AI providers that can do useful work through Kurukoo." />
    <AIProviderDirectory />
    <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><Panel className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-border px-4 py-3.5"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><Bot className="size-4"/></span><h2 className="text-[14px] font-semibold">Agent Brief</h2></div><Link to="/chat" className="text-[11px] font-medium">Ask Kurukoo <ArrowUpRight className="ml-1 inline size-3.5"/></Link></div><AgentIntelligence maxItems={5} title="" /></Panel><Panel className="p-4"><p className="text-[11px] text-muted-foreground">Start a job</p><div className="mt-3 grid gap-2">{quickJobs.map((job)=><Link key={job} to="/chat" onClick={() => localStorage.setItem("kurukoo-chat-draft", job)} className="flex min-h-10 items-center justify-between rounded-xl border border-border px-3 text-[12px] font-medium hover:bg-elevated">{job}<ArrowUpRight className="size-3.5 text-muted-foreground"/></Link>)}</div></Panel></section>
    <section><SectionHeader title="Running objectives" subtitle={goals.length ? `${goals.length} agent objective${goals.length === 1 ? "" : "s"}` : "No active objectives"} />{goals.length ? <div className="grid gap-3 md:grid-cols-2">{goals.map((goal)=><GoalCard key={goal.id} goal={goal} onChange={(next)=>setGoals(items=>next ? items.map(item=>item.id===next.id ? next : item) : items.filter(item=>item.id!==goal.id))}/>)}</div> : <Panel className="p-5"><div className="flex items-center gap-3"><Clock3 className="size-5 text-muted-foreground"/><div><p className="text-[13px] font-medium">No objectives running</p><p className="mt-1 text-[11.5px] text-muted-foreground">Start a job above and the connected runtime can surface its objective here.</p></div><Link to="/chat" className="ml-auto shrink-0 rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground">Start</Link></div></Panel>}</section>
    <section><SectionHeader title="All capability paths" subtitle={`${capabilityCount} paths available to the network`} /><div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{skillCategories.map(category=><details key={category.name} className="overflow-hidden rounded-2xl border border-border bg-surface"><summary className="cursor-pointer px-4 py-3 text-[12.5px] font-semibold">{category.name}<span className="ml-2 text-[10px] font-normal text-muted-foreground">{category.skills.length}</span></summary><div className="grid grid-cols-2 gap-1 border-t border-border/70 p-2">{category.skills.map(skill=><Link key={skill.id} to="/chat" onClick={() => localStorage.setItem("kurukoo-chat-draft", skill.label)} className="rounded-lg px-2.5 py-2 hover:bg-elevated"><p className="text-[11px] font-medium">{skill.label}</p><p className="text-[9px] text-muted-foreground">Start in Chat</p></Link>)}</div></details>)}</div></section>
    <div className="flex flex-wrap gap-2"><Link to="/work" className={actionClass()}>Open Work</Link><Link to="/activity" className={actionClass()}>Open Activity</Link></div>
  </div>;
}
