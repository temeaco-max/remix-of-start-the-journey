import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MapPin, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { CommerceOutcomes } from "@/components/kurukoo/commerce-outcomes";
import { SectionHeader } from "@/components/kurukoo/ui";
import { fetchCanonicalTopics, fetchDiscoveryEntities, type CanonicalTopic, type DiscoveryEntity } from "@/lib/kurukoo-api";
import { exploreGoalGroups } from "@/lib/explore-goals";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [
    { title: "Explore — Kurukoo" },
    { name: "description", content: "Explore ways to get everyday things done with Kurukoo, from food and mobility to work, community and safety." },
  ] }),
  component: ExplorePage,
});

const goalRoutes: Record<string, string> = {
  "money-circle": "/explore/money-circle", food: "/explore/food", groceries: "/explore/groceries", ride: "/explore/mobility", travel: "/explore/mobility", repair: "/explore/repairs", cleaning: "/explore/home", solar: "/explore/home", work: "/explore/work", sell: "/explore/selling", business: "/explore/work", health: "/explore/health", education: "/explore/learning", events: "/explore/events", spiritual: "/explore/prayer", connect: "/explore/community", emergency: "/explore/safety", security: "/explore/safety",
};

function pretty(value: string) { return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function ExplorePage() {
  const [q, setQ] = useState("");
  const [entities, setEntities] = useState<DiscoveryEntity[]>([]);
  const [topics, setTopics] = useState<CanonicalTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchDiscoveryEntities({ radius: 5000 }), fetchCanonicalTopics(6)]).then(([discovery, topic]) => {
      if (cancelled) return;
      if (discovery.status === "fulfilled") setEntities(discovery.value);
      if (topic.status === "fulfilled") setTopics(topic.value);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetchDiscoveryEntities({ radius: 5000, q: term })
        .then((results) => { if (!cancelled) setEntities(results); })
        .catch(() => { if (!cancelled) setEntities([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [q]);

  const filtered = useMemo(() => entities.slice(0, q.trim() ? 8 : 6), [entities, q]);

  return <div className="mx-auto w-full max-w-6xl space-y-10 pb-10">
    <PageHeader eyebrow="Explore" title="Get something done" subtitle="Start with the outcome. Choose a useful starting point or describe what you need and let Kurukoo work out the next step." />

    <section className="rounded-[22px] border border-border bg-surface p-5 md:p-6" aria-labelledby="start-with-need">
      <div className="max-w-3xl"><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">START WITH WHAT YOU NEED</p><h2 id="start-with-need" className="mt-1.5 font-serif text-[28px] leading-tight tracking-[-0.035em]">What would you like to get done?</h2><p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">Search for a goal, a local need or a service — or skip the search and simply tell Kurukoo.</p></div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input aria-label="Search things to get done" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “find a plumber” or “get a ride”" className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-[12.5px] outline-none focus:border-primary/40"/></div><AskKurukoo prompt={q.trim() ? `Help me ${q.trim()}.` : "Help me decide what I should get done next."} /></div>
    </section>

    <section aria-labelledby="goals"><SectionHeader title="Get something done" subtitle="Useful starting points across everyday life."/><div className="space-y-6">{exploreGoalGroups.map((group) => { const GroupIcon = group.icon; return <div key={group.id}><div className="mb-2.5 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-elevated"><GroupIcon className="size-3.5"/></span><h3 className="text-[13px] font-semibold">{group.label}</h3></div><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">{group.goals.map((goal) => { const Icon = goal.icon; const destination = goalRoutes[goal.id] ?? "/chat"; return <Link key={goal.id} to={destination as never} search={destination === "/chat" ? ({ query: goal.prompt } as never) : undefined} className="group flex min-h-[112px] flex-col rounded-[17px] border border-border bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:bg-elevated/45"><div className="flex items-start justify-between"><span className="grid size-8 place-items-center rounded-lg bg-brand-tint text-brand-ink"><Icon className="size-3.5"/></span><ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5"/></div><p className="mt-3 text-[12.5px] font-semibold">{goal.label}</p><span className="mt-auto pt-2 text-[9.5px] text-muted-foreground">{destination === "/chat" ? "Start in Chat" : "Open"}</span></Link>; })}</div></div>; })}</div></section>

    <CommerceOutcomes />

    <section aria-labelledby="around-you"><SectionHeader title="Around you" subtitle="Discovery helps you see what is nearby. A discovery result is context; a fulfilment request follows its own evidence and approval flow."/><div className="grid gap-3 md:grid-cols-3"><Link to="/discover" className="rounded-[19px] border border-primary/20 bg-brand-tint/20 p-4 hover:bg-brand-tint/30"><MapPin className="size-5 text-primary"/><h3 className="mt-3 text-[14px] font-semibold">Nearby</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Find useful people, places, businesses, offers, events and opportunities.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">Open Nearby <ArrowUpRight className="size-3"/></span></Link><Link to="/topics" className="rounded-[19px] border border-border bg-surface p-4 hover:bg-elevated"><Users className="size-5"/><h3 className="mt-3 text-[14px] font-semibold">Topics</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Use community questions, experiences and local context when it helps.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">Browse Topics <ArrowUpRight className="size-3"/></span></Link><Link to="/agents" className="rounded-[19px] border border-border bg-surface p-4 hover:bg-elevated"><Sparkles className="size-5 text-primary"/><h3 className="mt-3 text-[14px] font-semibold">Agents</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Let bounded agent work keep useful tasks moving when available.</p><span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium">See Agents <ArrowUpRight className="size-3"/></span></Link></div></section>

    {q.trim() ? <section aria-labelledby="matches"><SectionHeader title="Matches" subtitle={searching ? "Searching nearby…" : loading ? "Looking around…" : `${filtered.length} useful result${filtered.length === 1 ? "" : "s"} found`}/>{filtered.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <article key={item.id} className="rounded-[18px] border border-border bg-surface p-4"><p className="text-[14px] font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{pretty(item.category ?? item.kind)}{item.location ? ` · ${item.location}` : ""}</p>{item.description ? <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{item.description}</p> : null}<Link to="/chat" search={{ query: `Help me with ${item.name}` } as never} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium">Ask Kurukoo <ArrowUpRight className="size-3.5"/></Link></article>)}</div> : <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-[12px] text-muted-foreground">No matching discovery results. Tell Kurukoo what you need and it can work from the request instead.</div>}</section> : null}

    {topics.length ? <section><SectionHeader title="Community context" subtitle="Recent Topics that may help you understand what is happening around a goal."/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <Link key={topic.id} to="/topics/$slug" params={{ slug: topic.slug }} className="rounded-[18px] border border-border bg-surface p-4 hover:bg-elevated/45"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">TOPIC</p><h3 className="mt-2 text-[14px] font-semibold leading-snug">{topic.title}</h3><p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{topic.body}</p></Link>)}</div></section> : null}

    <section className="rounded-[22px] border border-border bg-elevated/35 p-5"><p className="text-[13px] font-semibold">Not sure where to start?</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">You do not need to choose a category. Describe the outcome and let Kurukoo take it from there.</p><div className="mt-4"><AskKurukoo prompt="I am not sure where to start. Help me work out what I need."/></div></section>
  </div>;
}
