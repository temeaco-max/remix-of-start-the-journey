import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bot, Globe2, Handshake, MessageCircle, Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AIProviderDirectory } from "@/components/kurukoo/ai-provider-directory";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/network")({
  head: () => ({ meta: [{ title: "Agent Network — Kurukoo" }, { name: "description", content: "Discover AI providers and people who can help through Kurukoo's network." }] }),
  component: NetworkPage,
});

const exampleConnections = [
  { title: "Local service agents", body: "People and businesses that can respond to real-world requests.", icon: UsersRound, action: "Find providers", to: "/providers" },
  { title: "Kurukoo AI providers", body: "Specialised AI companions for planning, research, language, learning and more.", icon: Bot, action: "Use an AI provider", to: "/agents" },
  { title: "Community connections", body: "Creators, contributors and people sharing useful local knowledge.", icon: Globe2, action: "Explore people", to: "/people" },
  { title: "Partners", body: "Organisations and services that extend what Kurukoo can help you accomplish.", icon: Handshake, action: "Meet partners", to: "/partners" },
];

function NetworkPage() {
  return <div className="space-y-8 pb-10">
    <PageHeader title="Agent Network" subtitle="Find the right person, business or AI provider for what you are trying to get done." />

    <section className="rounded-[22px] border border-primary/20 bg-brand-tint/20 p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl"><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">NETWORK</p><h2 className="mt-1.5 font-serif text-[28px] leading-tight tracking-[-0.035em]">Who can help?</h2><p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">Tell Kurukoo what you need and it can help you find an appropriate AI provider, human provider, business or partner.</p></div>
        <div className="flex shrink-0 flex-wrap gap-2"><AskKurukoo prompt="Find the right person, business or AI provider to help me with what I need."/><Link to="/providers" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[11.5px] font-medium hover:bg-elevated">Browse providers <ArrowUpRight className="size-3.5"/></Link></div>
      </div>
    </section>

    <section><SectionHeader title="Start here" subtitle="Choose the kind of help you are looking for."/><div className="grid gap-3 md:grid-cols-2">{exampleConnections.map(({ title, body, icon: Icon, action, to }) => <article key={title} className="rounded-[19px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/40"><span className="grid size-9 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Icon className="size-4"/></span><h3 className="mt-3 text-[14px] font-semibold">{title}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p><Link to={to as never} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium">{action} <ArrowUpRight className="size-3.5"/></Link></article>)}</div></section>

    <AIProviderDirectory />

    <section className="grid gap-3 md:grid-cols-2">
      <Panel className="p-5"><MessageCircle className="size-5 text-primary"/><h2 className="mt-3 text-[14px] font-semibold">Start a conversation</h2><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Describe the outcome. You do not need to know which provider should handle it.</p><div className="mt-4"><AskKurukoo prompt="I need help finding the right person or provider for something I need to get done."/></div></Panel>
      <Panel className="p-5"><Plus className="size-5 text-primary"/><h2 className="mt-3 text-[14px] font-semibold">Offer what you can do</h2><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">If you provide a service, make your capability discoverable through Kurukoo.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/provider" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground">Become a provider <ArrowUpRight className="size-3.5"/></Link><Link to="/chat" search={{ query: "Help me offer a service on Kurukoo." } as never} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium">Ask Kurukoo</Link></div></Panel>
    </section>
  </div>;
}
