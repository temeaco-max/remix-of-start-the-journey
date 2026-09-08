import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { VideoCard } from "@/components/kurukoo/cards";
import { actionClass } from "@/components/kurukoo/primitives";
import { entityById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — Kurukoo" }, { name: "description", content: "See Kurukoo in a few simple steps." }] }),
  component: HowItWorksPage,
});

const steps = [
  [MessageCircle, "Tell Kurukoo", "Say what you need."],
  [Search, "Find the next step", "Kurukoo works through the request."],
  [ShieldCheck, "Review", "See the useful options and decisions."],
  [Check, "Get it done", "Keep the result in your workspace."],
] as const;

function HowItWorksPage() {
  const guide = videos[0];
  const creator = entityById(guide.creatorId);
  return <div className="mx-auto w-full max-w-4xl space-y-8">
    <header className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kurukoo</p>
      <h1 className="mt-2 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">Just tell it what you need.</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">Four simple steps from a request to a result.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2">
      {steps.map(([Icon, title, body], index) => <div key={title} className="rounded-[18px] border border-border bg-surface p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-elevated"><Icon className="size-4" /></span><span className="text-[10px] text-muted-foreground">0{index + 1}</span></div><h2 className="mt-4 text-[15px] font-semibold">{title}</h2><p className="mt-1 text-[12px] text-muted-foreground">{body}</p></div>)}
    </section>

    <section className="grid gap-5 rounded-[22px] border border-border bg-surface p-5 md:grid-cols-[1.15fr_.85fr] md:items-center">
      <div><p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Watch</p><h2 className="mt-1.5 text-[20px] font-semibold">See it in action</h2><p className="mt-1.5 text-[12.5px] text-muted-foreground">Prefer a visual guide?</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/videos" className={actionClass("primary")}>How-to videos <ArrowRight className="size-3.5" /></Link><Link to="/chat" className={actionClass()}>Try Kurukoo</Link></div></div>
      {creator ? <VideoCard video={guide} creatorName={creator.name} /> : null}
    </section>
  </div>;
}
