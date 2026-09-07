import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Compass, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — Kurukoo" },
    { name: "description", content: "Why Kurukoo exists: a conversation-first coordination layer for getting useful things done." },
    { property: "og:title", content: "About — Kurukoo" },
    { property: "og:description", content: "Why Kurukoo exists and how its conversation-first model works." },
  ]}),
  component: AboutPage
});

function AboutPage() {
  return <div className="mx-auto w-full max-w-5xl">
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
      <div className="max-w-4xl">
        <p className="text-[12px] font-medium text-muted-foreground">About Kurukoo</p>
        <h1 className="mt-2 max-w-4xl font-serif text-[44px] leading-[1.01] tracking-[-0.05em] md:text-[62px]">A calmer way to get life moving.</h1>
        <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">Kurukoo is a conversation-first coordination layer. You describe what needs doing; Kurukoo helps understand it, find useful people or options, coordinate the work and keep the trail readable.</p>
        <div className="mt-7 flex flex-wrap gap-2"><Link to="/how-it-works" className={actionClass("primary")}>How it works <ArrowUpRight className="size-3.5" /></Link><Link to="/" className={actionClass()}>Try Kurukoo</Link></div>
      </div>
      <Panel className="p-5">
        <div className="flex items-start gap-3"><Compass className="mt-0.5 size-5 text-primary" /><div><p className="text-[12.5px] font-semibold">The idea</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Reduce the work between knowing what you need and taking a useful next step.</p></div></div>
      </Panel>
    </section>

    <section className="mt-12">
      <div className="mb-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">What guides the system</p><h2 className="mt-1.5 text-[24px] font-semibold tracking-tight">Simple on the surface. Deliberate underneath.</h2></div>
      <div className="grid gap-3 md:grid-cols-3">
        <Panel className="p-5"><Sparkles className="size-5 text-primary" /><h3 className="mt-4 text-[15px] font-semibold">Conversation first</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">People should not have to learn an app's categories before they can ask for help.</p></Panel>
        <Panel className="p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-4 text-[15px] font-semibold">Truth before convenience</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Availability, pricing and provider claims should be grounded in evidence, not invented to make a flow look complete.</p></Panel>
        <Panel className="p-5"><Users className="size-5 text-primary" /><h3 className="mt-4 text-[15px] font-semibold">People stay in control</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Kurukoo can coordinate, but meaningful commitments remain visible and approval-led.</p></Panel>
      </div>
    </section>

    <section className="mt-12 grid gap-6 border-t border-border pt-9 md:grid-cols-[1.2fr_.8fr]">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">What we are building</p><div className="mt-4 space-y-4 text-[14px] leading-7 text-muted-foreground"><p>Kurukoo connects requests, people, businesses, creators, Topics, opportunities and useful context around a single principle: reduce the work between deciding what you need and getting a useful result.</p><p>The public experience explains the system. The OS experience is where that system becomes personal, persistent and actionable.</p></div></div>
      <Panel className="h-fit bg-elevated/35 p-5"><p className="text-[13px] font-semibold">Explore the model</p><div className="mt-3 space-y-2 text-[12.5px] text-muted-foreground"><Link to="/capabilities" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-background"><span>Capabilities</span><ArrowUpRight className="size-3.5" /></Link><Link to="/topics" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-background"><span>Community Topics</span><ArrowUpRight className="size-3.5" /></Link><Link to="/help" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-background"><span>Help centre</span><ArrowUpRight className="size-3.5" /></Link></div></Panel>
    </section>
  </div>;
}
