import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { Action } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — Kurukoo" }, { name: "description", content: "See how Kurukoo turns a plain-language request into coordinated work." }] }),
  component: HowItWorksPage,
});

const steps = [
  [MessageCircle, "Tell Kurukoo", "Say what you need in your own words. A request can start as simply as “I need someone to fix my phone.”"],
  [Search, "Understand and find", "Kurukoo works out the useful detail, searches the right parts of its network and surfaces options that can be grounded in evidence."],
  [ShieldCheck, "Check before committing", "You see the important decision points. Kurukoo does not pretend a booking, payment or contact happened when it did not."],
  [Check, "Coordinate and remember", "Once you approve the next step, the work can move forward and the resulting trail stays readable in your OS."],
] as const;

function HowItWorksPage() {
  return <div className="mx-auto w-full max-w-4xl">
    <section className="max-w-3xl"><p className="text-[12px] font-medium text-muted-foreground">The Kurukoo loop</p><h1 className="mt-2 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[54px]">From “I need this” to a useful result.</h1><p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">Kurukoo is designed to remove coordination work without removing your control.</p></section>
    <div className="mt-10 space-y-3">{steps.map(([Icon, title, body], index) => <Panel key={title} className="flex gap-4 p-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">0{index + 1}</p><h2 className="mt-1 text-[16px] font-semibold">{title}</h2><p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{body}</p></div></Panel>)}</div>
    <section className="mt-10 rounded-[24px] border border-border bg-surface p-6"><p className="text-[12px] font-medium text-muted-foreground">The important distinction</p><p className="mt-2 max-w-2xl text-[20px] font-medium tracking-tight">Kurukoo coordinates the work. You remain the authority on meaningful commitments.</p><div className="mt-5 flex flex-wrap gap-2"><Link to="/" className={actionClass("primary")}>Try a request</Link><Link to="/capabilities" className={actionClass()}>See capabilities</Link></div></section>
    <div className="mt-6 flex justify-end"><Link to="/about" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground">About Kurukoo <ArrowRight className="size-3.5" /></Link></div>
  </div>;
}
