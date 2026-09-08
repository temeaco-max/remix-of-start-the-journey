import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MessageCircle, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { fetchCanonicalTopics, fetchTopicTaxonomy, type CanonicalTopic, type TopicTaxonomy } from "@/lib/kurukoo-api";
import { topics as demoTopics } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/topics")({
  head: () => ({ meta: [
    { title: "Topics — Kurukoo" },
    { name: "description", content: "Explore questions, experiences, local reports and useful community discussion on Kurukoo." },
  ] }),
  component: TopicsPage,
});

const pretty = (value: string) => value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function TopicCard({ topic }: { topic: CanonicalTopic }) {
  const locality = [topic.city, topic.lga].filter(Boolean).join(" · ");
  return <Link to="/topics/$slug" params={{ slug: topic.slug }} className="group rounded-[19px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/45"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5 text-[10.5px] text-muted-foreground"><span className="rounded-full bg-elevated px-2 py-1 font-medium text-foreground/80">{pretty(topic.type)}</span>{topic.category ? <span className="rounded-full bg-elevated px-2 py-1">{pretty(topic.category)}</span> : null}{locality ? <span className="rounded-full bg-elevated px-2 py-1">{locality}</span> : null}</div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></div><h2 className="mt-4 text-[15.5px] font-medium leading-snug">{topic.title}</h2><p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">{topic.body}</p><div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}</span><span>·</span><span>{topic.authorLabel}</span></div></Link>;
}

function TopicsPage() {
  const [topics, setTopics] = useState<CanonicalTopic[]>([]);
  const [taxonomy, setTaxonomy] = useState<TopicTaxonomy>({ types: [], categories: [], skillsByCategory: {} });
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadTopics(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    try { setTopics(await fetchCanonicalTopics(20, { type, category })); setError(""); }
    catch (e) { setTopics([]); setError(e instanceof Error ? e.message : "Topics are unavailable right now."); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void fetchTopicTaxonomy().then(setTaxonomy).catch(() => undefined); }, []);
  useEffect(() => { void loadTopics(); }, [type, category]);

  return <div className="mx-auto w-full max-w-6xl space-y-10 pb-10">
    <header className="max-w-3xl"><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">TOPICS</p><h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">What people are talking about</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">Questions, experiences, local reports and opinions become useful community context. Kurukoo can use that context when helping you decide what to do next.</p><div className="mt-5 flex flex-wrap gap-2"><Link to="/topics/create" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[12px] font-medium text-primary-foreground"><Plus className="size-4" />Create a Topic</Link><Link to="/topics/mine" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[12px] font-medium hover:bg-elevated">Your Topics</Link><AskKurukoo prompt="Help me find a useful Topic for what I am trying to do." /></div></header>

    <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-[18px] border border-border bg-surface p-4"><MessageCircle className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Start a conversation</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Ask a question or share an experience others can learn from.</p></div><div className="rounded-[18px] border border-border bg-surface p-4"><Users className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Find local context</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Browse community knowledge around places, services and everyday life.</p></div><div className="rounded-[18px] border border-border bg-surface p-4"><ShieldCheck className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Keep context trustworthy</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Topics are community context, not proof of a provider, price or availability.</p></div></section>

    <section aria-labelledby="browse-topics"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">BROWSE</p><h2 id="browse-topics" className="mt-1.5 font-serif text-[28px] tracking-[-0.035em]">Recent Topics</h2><p className="mt-1 text-[12px] text-muted-foreground">{loading ? "Loading community context…" : error || `${topics.length} public ${topics.length === 1 ? "Topic" : "Topics"}`}</p></div><button type="button" onClick={() => void loadTopics(true)} disabled={refreshing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium hover:bg-elevated disabled:opacity-50"><RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"}/>Refresh</button></div><div className="mb-4 flex flex-wrap gap-2"><select aria-label="Filter Topics by type" value={type} onChange={(e) => setType(e.target.value)} className="min-h-9 rounded-lg border border-border bg-background px-3 text-[11.5px]"><option value="">All types</option>{taxonomy.types.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select><select aria-label="Filter Topics by category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-9 rounded-lg border border-border bg-background px-3 text-[11.5px]"><option value="">All categories</option>{taxonomy.categories.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select></div>{loading ? <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map((i) => <div key={i} className="h-44 animate-pulse rounded-[19px] border border-border bg-surface" />)}</div> : topics.length ? <div className="grid gap-3 sm:grid-cols-2">{topics.map((topic) => <TopicCard key={topic.id} topic={topic}/>)}</div> : <div className="grid gap-3 sm:grid-cols-2">{demoTopics.map((topic) => <Link key={topic.slug} to="/topics/$slug" params={{ slug: topic.slug }} className="rounded-[19px] border border-border bg-surface p-4 hover:bg-elevated/45"><p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary">COMMUNITY</p><h2 className="mt-3 text-[15.5px] font-semibold">{topic.name}</h2><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{topic.blurb}</p><p className="mt-4 text-[11px] text-muted-foreground">{topic.posts.length} replies · {topic.followers.toLocaleString()} followers</p></Link>)}</div>}</section>

    <section className="rounded-[22px] border border-border bg-elevated/35 p-5"><p className="text-[13px] font-semibold">Use a Topic when context will help.</p><p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-muted-foreground">If a discussion helps you decide what to do, bring it into Kurukoo. The resulting request still needs its own evidence and approval.</p><Link to="/explore" className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium">Explore what you can do <ArrowRight className="size-3.5"/></Link></section>

    <FAQSection title="Topics questions" items={[{ question: "What are Topics?", answer: "Topics are public community conversations containing questions, experiences, local reports and opinions." }, { question: "Can a Topic prove that a provider is available?", answer: "No. Community discussion can inform a decision, but fulfilment follows its own evidence, availability and approval flow." }, { question: "Can I use a Topic with Kurukoo?", answer: "Yes. Bring useful community context into a conversation and ask Kurukoo what it means for the thing you are trying to do." }]} />
  </div>;
}
