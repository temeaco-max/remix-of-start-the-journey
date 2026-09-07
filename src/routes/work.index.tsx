import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, ListChecks, Sparkles } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { WorkItemCard } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/work/")({
  head: () => ({
    meta: [
      { title: "Work — Kurukoo" },
      { name: "description", content: "Everything Kurukoo is handling for you, and what it needs from you." },
      { property: "og:title", content: "Work — Kurukoo" },
      { property: "og:description", content: "Track requests Kurukoo is carrying out on your behalf." },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const { work, advance } = useKurukoo();
  const active = work.filter((item) => item.stage !== "done");
  const needsYou = work.filter((item) => item.stage === "needs_you");
  const completed = work.filter((item) => item.stage === "done");

  return <div className="space-y-6">
    <PageHeader title="Work" subtitle="What Kurukoo is taking care of right now." />

    <section className="relative overflow-hidden rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-brand-tint/60 blur-3xl" />
      <div className="relative flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Sparkles className="size-[18px]" /></span><div><p className="text-[13px] font-medium text-muted-foreground">Kurukoo at work</p><h2 className="mt-1 text-[20px] font-semibold tracking-tight">You stay in control. Kurukoo carries the work.</h2><p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">Requests move here as they are understood, coordinated and completed. Anything requiring your approval is clearly marked.</p></div></div>
    </section>

    <div className="grid gap-3 sm:grid-cols-3">
      <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><ListChecks className="size-4" /><span className="text-[12px]">In progress</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{active.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Requests being handled</p></Panel>
      <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" /><span className="text-[12px]">Needs you</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{needsYou.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Waiting for approval or input</p></Panel>
      <Panel className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="size-4" /><span className="text-[12px]">Completed</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{completed.length}</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">Finished requests</p></Panel>
    </div>

    {work.length === 0 ? <EmptyState title="Nothing in flight" body="Ask Kurukoo for something on Home and it will show up here as it makes progress." /> : <section><div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold tracking-tight">Your requests</h2><span className="text-[12px] text-muted-foreground">{work.length} total</span></div><ul className="space-y-3">{work.map((item) => <li key={item.id}><WorkItemCard item={item} onAdvance={advance} /></li>)}</ul></section>}
  </div>;
}
