import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, ListChecks, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { fetchTaskSummary, fetchTasks, acceptTask, completeTask, type KurukooTask } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Kurukoo" },
      { name: "description", content: "See tasks you can take on through Kurukoo and the canonical work already assigned to you." },
    ],
  }),
  component: TasksPage,
});

function sourceLink(task: KurukooTask) {
  if (!task.sourceType || !task.sourceId) return null;
  if (task.sourceType === "topic") return { href: "/topics", label: "Open Topics" };
  if (task.sourceType === "conversation") return { href: "/chat", label: "Open conversation" };
  if (["request", "economic_request", "work"].includes(task.sourceType)) {
    return { href: "/work/" + encodeURIComponent(task.sourceId), label: "Open Work" };
  }
  if (task.sourceType === "agent") return { href: "/agents", label: "Open Agent" };
  return null;
}

function reward(task: KurukooTask) {
  const value = Number(task.creditsReward ?? 0);
  return Number.isFinite(value) && value > 0 ? value + " Points" : "Reward not specified";
}

function TaskCard({ task, onAccept, onComplete }: {
  task: KurukooTask;
  onAccept: (task: KurukooTask) => Promise<void>;
  onComplete: (task: KurukooTask, result: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const available = task.status === "available";
  const active = task.status === "in_progress";
  const source = sourceLink(task);

  async function take() {
    setBusy(true);
    try { await onAccept(task); } finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true);
    try { await onComplete(task, note); setSubmitting(false); setNote(""); } finally { setBusy(false); }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground">
          {available ? <ListChecks className="size-4" /> : active ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold">{task.title}</h3>
            <span className="rounded-full bg-elevated px-2 py-1 text-[9.5px] font-medium capitalize">{task.status.replace(/_/g, " ")}</span>
          </div>
          {task.description ? <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{task.description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
            <span className="font-medium text-foreground">{reward(task)}</span>
            {task.sourceType ? <span>· source: {task.sourceType.replace(/_/g, " ")}</span> : null}
            {task.updatedAt ? <span>· {new Date(task.updatedAt).toLocaleString()}</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {available ? (
          <button type="button" disabled={busy} onClick={() => void take()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[11.5px] font-medium text-primary-foreground disabled:opacity-50">
            {busy ? "Accepting…" : "Take task"} <ArrowRight className="size-3.5" />
          </button>
        ) : null}
        {active ? (
          <>
            <button type="button" disabled={busy} onClick={() => setSubmitting((value) => !value)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[11.5px] font-medium hover:bg-elevated disabled:opacity-50">
              {submitting ? "Close submission" : "Submit completion"}
            </button>
            {submitting ? (
              <div className="w-full rounded-xl border border-border bg-elevated/30 p-3">
                <label className="block text-[10.5px] font-medium text-muted-foreground">
                  Completion note <span className="font-normal">(optional)</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={3} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[11.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Add the result or evidence note required for this task." />
                </label>
                <button type="button" disabled={busy} onClick={() => void submit()} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-medium text-primary-foreground disabled:opacity-50">
                  {busy ? "Submitting…" : "Submit"} <ArrowRight className="size-3.5" />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {source ? (
          <a href={source.href} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[11.5px] font-medium hover:bg-elevated">
            {source.label} <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState<KurukooTask[]>([]);
  const [summary, setSummary] = useState({ available: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const [items, metrics] = await Promise.all([fetchTasks(), fetchTaskSummary()]);
      setTasks(items);
      setSummary(metrics);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tasks are unavailable right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(true); }, [load]);

  const available = useMemo(() => tasks.filter((task) => task.status === "available"), [tasks]);
  const inProgress = useMemo(() => tasks.filter((task) => task.status === "in_progress"), [tasks]);
  const completed = useMemo(() => tasks.filter((task) => task.status === "completed" || task.status === "approved"), [tasks]);
  const exceptional = useMemo(() => tasks.filter((task) => !["available", "in_progress", "completed", "approved"].includes(task.status)), [tasks]);

  const replaceTask = (updated: KurukooTask) => setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));

  const handleAccept = async (task: KurukooTask) => {
    try {
      replaceTask(await acceptTask(task.id));
      setSummary((current) => ({ ...current, available: Math.max(0, current.available - 1), inProgress: current.inProgress + 1 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This task could not be accepted.");
    }
  };

  const handleComplete = async (task: KurukooTask, result: string) => {
    try {
      await completeTask(task.id, result);
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "completed" } : item));
      setSummary((current) => ({ ...current, inProgress: Math.max(0, current.inProgress - 1), completed: current.completed + 1 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This task could not be completed.");
    }
  };

  return (
    <div className="space-y-7 pb-12">
      <PageHeader
        eyebrow="Tasks"
        title="What you can do through Kurukoo."
        subtitle="Tasks are contribution opportunities and assignments. Work remains the execution surface for what Kurukoo is doing for you."
        action={
          <button type="button" onClick={() => void load()} disabled={refreshing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-elevated disabled:opacity-50">
            <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <section className="grid grid-cols-3 gap-3" aria-label="Task summary">
        {[
          ["Available", summary.available],
          ["In progress", summary.inProgress],
          ["Completed", summary.completed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{loading ? "—" : value}</p>
          </div>
        ))}
      </section>

      {error ? <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-[11.5px] text-destructive">{error}</div> : null}

      {loading ? (
        <section className="grid gap-3" aria-label="Loading tasks">
          <div className="h-32 animate-pulse rounded-2xl bg-elevated" />
          <div className="h-32 animate-pulse rounded-2xl bg-elevated" />
        </section>
      ) : (
        <>
          <section aria-labelledby="available-tasks">
            <div className="mb-3">
              <h2 id="available-tasks" className="text-[18px] font-semibold tracking-tight">Available to you</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Only tasks returned by the authenticated canonical task service appear here.</p>
            </div>
            {available.length ? (
              <div className="grid gap-3 lg:grid-cols-2">{available.map((task) => <TaskCard key={task.id} task={task} onAccept={handleAccept} onComplete={handleComplete} />)}</div>
            ) : (
              <EmptyState title="No tasks available right now" body="When the canonical task service has an available assignment for this account, it will appear here. No opportunity or payout is invented when the queue is empty." />
            )}
          </section>

          <section aria-labelledby="your-tasks">
            <div className="mb-3">
              <h2 id="your-tasks" className="text-[18px] font-semibold tracking-tight">Your tasks</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Accepted tasks remain connected to their canonical source and use the existing task lifecycle.</p>
            </div>
            {inProgress.length ? (
              <div className="grid gap-3 lg:grid-cols-2">{inProgress.map((task) => <TaskCard key={task.id} task={task} onAccept={handleAccept} onComplete={handleComplete} />)}</div>
            ) : (
              <EmptyState title="Nothing in progress" body="Tasks you accept will stay here until the canonical completion step is submitted." />
            )}
            {completed.length ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{completed.map((task) => <TaskCard key={task.id} task={task} onAccept={handleAccept} onComplete={handleComplete} />)}</div> : null}
            {exceptional.length ? (
              <div className="mt-3 rounded-2xl border border-border bg-elevated/30 p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[12px] font-semibold">Other task states</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">These states remain visible but actionless because the canonical task service controls their lifecycle.</p>
                    <p className="mt-2 text-[10.5px] text-muted-foreground">{exceptional.map((task) => task.title + " · " + task.status.replace(/_/g, " ")).join(" · ")}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-brand-ink"><ShieldCheck className="size-4" /></span>
                <div>
                  <h2 className="text-[15px] font-semibold">Qualifications and capabilities</h2>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">Task eligibility is represented by what the canonical task service actually returns. Manage the capabilities you can offer through your existing capability profile; this page does not infer qualifications or unlocks.</p>
                  <a href="/capabilities" className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-elevated">Review capabilities <ArrowRight className="size-3.5" /></a>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-elevated/35 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-elevated text-muted-foreground"><Sparkles className="size-4" /></span>
                <div>
                  <h2 className="text-[15px] font-semibold">Tasks and Work stay connected</h2>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">A Task is the contribution or assignment view. Work remains the canonical execution and coordination surface; task source links return you to the originating object where supported.</p>
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
