import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bot, Clock3, Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AIProviderDirectory } from "@/components/kurukoo/ai-provider-directory";
import { AgentIntelligence } from "@/components/kurukoo/agent-intelligence";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { controlAgentGoal, fetchAgentGoals, type AgentGoal } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "AI agents — Kurukoo" }, { name: "description", content: "Use Kurukoo agents to coordinate everyday work and keep tasks moving." }] }),
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
  return <article className="rounded-2xl border border-border bg-surface p-4 hover:bg-elevated/40"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Bot className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-[13.5px] font-semibold">{goal.objective || goal.skill || "Agent task"}</h3><span className="rounded-full bg-elevated px-2 py-0.5 text-[9.5px]">{status.replace(/[_-]/g, " ")}</span></div>{goal.nextRunAt ? <p className="mt-1 text-[11px] text-muted-foreground">Next run · {new Date(goal.nextRunAt).toLocaleString()}</p> : null}</div></div><div className="mt-3 flex flex-wrap gap-2">{next ? <Action onClick={() => void run(next)} disabled={busy}>{next === "pause" ? <><Pause className="mr-1.5 size-3.5" />Pause</> : <><Play className="mr-1.5 size-3.5" />Resume</>}</Action> : null}{status !== "cancelled" && status !== "completed" ? <Action onClick={() => void run("cancel")} disabled={busy}><Square className="mr-1.5 size-3.5" />Stop</Action> : null}{goal.conversationId ? <Link to="/chat" className={actionClass()}>Open conversation <ArrowUpRight className="ml-1 size-3.5" /></Link> : null}</div></article>;
}

const quickJobs = ["Get me a ride", "Find a plumber", "Order food", "Repair my phone", "Pray with me", "Plan my day"];

function PublicAgents() {
  return <div className="mx-auto w-full max-w-6xl space-y-9 pb-8"><header className="max-w-3xl"><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">AGENTS</p><h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">Let Kurukoo keep the work moving</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">Kurukoo agents can help carry an agreed task forward after you explain what you need. You stay in control of important decisions and approvals.</p><div className="mt-5 flex flex-wrap gap-2"><AskKurukoo prompt="Help me understand what Kurukoo can do for me." /><Link to="/login" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium hover:bg-elevated">Log in to manage agents</Link></div></header><section className="grid gap-3 md:grid-cols-3"><Panel className="p-4"><Bot className="size-5 text-primary"/><h2 className="mt-3 text-[14px] font-semibold">Start with an outcome</h2><p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Tell Kurukoo what needs doing instead of learning a list of commands.</p></Panel><Panel className="p-4"><Clock3 className="size-5 text-primary"/><h2 className="mt-3 text-[14px] font-semibold">Keep it moving</h2><p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Supported tasks can continue through the appropriate request and work flow.</p></Panel><Panel className="p-4"><Square className="size-5 text-primary"/><h2 className="mt-3 text-[14px] font-semibold">Stay in control</h2><p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Important actions remain visible and can require your approval before they happen.</p></Panel></section><section><SectionHeader title="Ways to start" subtitle="You can begin in Conversation, Explore or from an agent-enabled task."/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{quickJobs.map((job) => <Link key={job} to="/chat" search={{ query: job } as never} className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 text-[12.5px] font-medium hover:bg-elevated">{job}<ArrowUpRight className="size-3.5 text-muted-foreground"/></Link>)}</div></section></div>;
}

function AuthenticatedAgents() {
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  useEffect(() => { void fetchAgentGoals().then(setGoals).catch(() => setGoals([])); }, []);
  return <div className="space-y-7"><PageHeader title="Agents" subtitle="AI providers and tasks running for you." /><AIProviderDirectory /><section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><Panel className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-border px-4 py-3.5"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><Bot className="size-4" /></span><h2 className="text-[14px] font-semibold">Agent Brief</h2></div><Link to="/chat" className="text-[11px] font-medium">Ask Kurukoo <ArrowUpRight className="ml-1 inline size-3.5" /></Link></div><AgentIntelligence maxItems={5} title="" /></Panel><Panel className="p-4"><p className="text-[11px] text-muted-foreground">Start a job</p><div className="mt-3 grid gap-2">{quickJobs.map((job) => <Link key={job} to="/chat" search={{ query: job } as never} className="flex min-h-10 items-center justify-between rounded-xl border border-border px-3 text-[12px] font-medium hover:bg-elevated">{job}<ArrowUpRight className="size-3.5 text-muted-foreground" /></Link>)}</div></Panel></section><section><SectionHeader title="Running" subtitle={goals.length ? `${goals.length} active` : ""} />{goals.length ? <div className="grid gap-3 md:grid-cols-2">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onChange={(next) => setGoals((items) => next ? items.map((item) => item.id === next.id ? next : item) : items.filter((item) => item.id !== goal.id))} />)}</div> : <Panel className="p-5"><div className="flex items-center gap-3"><Clock3 className="size-5 text-muted-foreground" /><div><p className="text-[13px] font-medium">Nothing running</p><p className="mt-1 text-[11px] text-muted-foreground">Start a job above.</p></div><Link to="/chat" className="ml-auto shrink-0 rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground">Start</Link></div></Panel>}</section><div className="flex flex-wrap gap-2"><Link to="/work" className={actionClass()}>Open Work</Link><Link to="/activity" className={actionClass()}>Open Activity</Link></div></div>;
}

function AgentsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const read = () => { setAuthenticated(window.localStorage.getItem("kurukoo-authenticated") === "true"); setReady(true); }; read(); window.addEventListener("kurukoo-auth-updated", read); window.addEventListener("storage", read); return () => { window.removeEventListener("kurukoo-auth-updated", read); window.removeEventListener("storage", read); }; }, []);
  return ready && authenticated ? <AuthenticatedAgents /> : <PublicAgents />;
}
