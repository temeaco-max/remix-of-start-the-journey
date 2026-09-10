import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass } from "@/components/kurukoo/primitives";
import { AdSlot, SectionHeader } from "@/components/kurukoo/ui";
import { fetchDailyPick, type DailyPick } from "@/lib/daily-picks-api";

export const Route = createFileRoute("/daily-picks")({
  head: () => ({ meta: [
    { title: "Daily Picks — Kurukoo" },
    { name: "description", content: "A short, useful pick from Kurukoo based on available context." },
  ] }),
  component: DailyPicksPage,
});

function PickCard({ pick }: { pick: DailyPick }) {
  return <article className="rounded-[22px] border border-border bg-surface p-5 md:p-6">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Sparkles className="size-4.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Today's pick</p>
        <h2 className="mt-1.5 font-serif text-[28px] leading-tight tracking-[-0.035em]">{pick.title}</h2>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">{pick.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {pick.price ? <span className="rounded-full bg-elevated px-2.5 py-1.5 text-[10.5px] font-semibold">{pick.price}</span> : null}
          {typeof pick.creditReward === "number" ? <span className="rounded-full bg-elevated px-2.5 py-1.5 text-[10.5px] text-muted-foreground">{pick.creditReward} Point reward</span> : null}
        </div>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      <AskKurukoo prompt={`Tell me more about today's Kurukoo pick: ${pick.title}. If it is suitable, help me make a verified request.`} />
      <Link to="/chat" search={{ query: `Tell me more about today's Kurukoo pick: ${pick.title}` } as never} className={actionClass()}>Ask in chat <ArrowUpRight className="ml-1 size-3.5" /></Link>
    </div>
  </article>;
}

function DailyPicksPage() {
  const [pick, setPick] = useState<DailyPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try { setPick(await fetchDailyPick()); }
    catch (cause) { setPick(null); setError(cause instanceof Error ? cause.message : "Today's pick is unavailable right now."); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { void load(); }, []);

  return <>
    <PageHeader title="Daily Picks" subtitle="A short list worth your attention today." />
    {loading ? <div className="h-44 animate-pulse rounded-[22px] bg-elevated/40" /> : pick ? <PickCard pick={pick} /> : <section className="rounded-[22px] border border-dashed border-border px-5 py-10 text-center"><p className="text-[13px] font-medium">No pick is available right now.</p><p className="mt-1.5 text-[11px] text-muted-foreground">Kurukoo will not invent a recommendation when the source is unavailable.</p>{error ? <p className="mt-2 text-[10.5px] text-destructive">{error}</p> : null}<button type="button" onClick={() => void load(true)} disabled={refreshing} className="mx-auto mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium hover:bg-elevated disabled:opacity-50"><RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} /> Try again</button></section>}
    <section className="mt-8">
      <SectionHeader title="Turn a pick into action" subtitle="Ask Kurukoo to check whether it is suitable for what you need." />
      <div className="rounded-[20px] border border-border bg-elevated/30 p-5">
        <div className="flex flex-wrap gap-2">
          <AskKurukoo prompt="What is worth doing today based on what you know about what I need?" />
          <Link to="/explore" className={actionClass()}>Explore what's available <ArrowUpRight className="ml-1 size-3.5" /></Link>
        </div>
      </div>
    </section>
    <div className="mt-8"><AdSlot placement="Daily Picks" headline="Sponsored placement" body="Sponsored content is clearly separated from Kurukoo's organic pick." advertiser="" /></div>
  </>;
}
