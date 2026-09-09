import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronDown, MessageCircle, Plus, RefreshCw, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type TopicSort = "recent" | "updated" | "trending" | "new-posts";

function TopicCard({ topic }: { topic: CanonicalTopic }) {
  const locality = [topic.city, topic.lga].filter(Boolean).join(" · ");
  return <Link to="/topics/$slug" params={{ slug: topic.slug }} className="group rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/45">
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-wrap gap-1.5 text-[10.5px] text-muted-foreground">
        <span className="rounded-full bg-elevated px-2 py-1 font-medium text-foreground/80">{pretty(topic.type)}</span>
        {topic.category ? <span className="rounded-full bg-elevated px-2 py-1">{pretty(topic.category)}</span> : null}
        {locality ? <span className="rounded-full bg-elevated px-2 py-1">{locality}</span> : null}
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </div>
    <h2 className="mt-4 text-[15.5px] font-medium leading-snug">{topic.title}</h2>
    <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">{topic.body}</p>
    <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}</span><span>·</span><span>{topic.authorLabel}</span></div>
  </Link>;
}

function TopicAdSlot({ label, large = false }: { label: string; large?: boolean }) {
  return <div className={`flex ${large ? "min-h-[250px]" : "min-h-[92px]"} items-center justify-center rounded-[18px] border border-dashed border-border bg-elevated/20 px-4 text-center`}>
    <div><p className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Advertising</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>
  </div>;
}

function CategoryDirectory({ taxonomy, activeCategory, onSelect }: { taxonomy: TopicTaxonomy; activeCategory: string; onSelect: (category: string) => void }) {
  const categories = taxonomy.categories;
  return <section aria-labelledby="topic-categories" className="space-y-3">
    <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">CATEGORIES</p><h2 id="topic-categories" className="mt-1.5 font-serif text-[28px] tracking-[-0.035em]">Browse the community</h2></div><span className="text-[10px] text-muted-foreground">Admin-managed taxonomy</span></div>
    <div className="rounded-[20px] border border-border bg-surface p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((item, index) => {
          const subcategories = taxonomy.skillsByCategory[item] ?? [];
          const selected = item === activeCategory;
          return <div key={item} className={`rounded-2xl p-3 ${selected ? "bg-brand-tint/20" : "bg-background"}`}>
            <button type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className={`text-[12.5px] font-semibold ${selected ? "text-primary" : ""}`}>{pretty(item)}</span>
              <ChevronDown className={`size-3.5 transition-transform ${selected ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
            </button>
            {subcategories.length ? <div className="mt-2 flex flex-wrap gap-1.5">
              {subcategories.map((sub) => <button type="button" key={sub} onClick={() => onSelect(item)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/30 hover:text-foreground">{pretty(sub)}</button>)}
            </div> : <p className="mt-2 text-[10px] text-muted-foreground">Topics in this category</p>}
            {index === 0 ? <p className="mt-2 text-[9.5px] text-primary">Default category</p> : null}
          </div>;
        })}
      </div>
    </div>
  </section>;
}

function TopicRateCard({ category }: { category: string }) {
  return <div className="rounded-[18px] bg-elevated/30 p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">ADVERTISING</p><h3 className="mt-1 text-[14px] font-semibold">{pretty(category)} rate card</h3></div><span className="rounded-full bg-surface px-2 py-1 text-[9px] text-muted-foreground">Admin controlled</span></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {["Top card slot", "Top card slot 2", "Bottom large slot"].map((slot) => <div key={slot} className="rounded-xl bg-surface px-3 py-2.5"><p className="text-[10.5px] font-medium">{slot}</p><p className="mt-1 text-[9.5px] text-muted-foreground">Rate set per category</p></div>)}
    </div>
  </div>;
}

function TopicsPage() {
  const [topics, setTopics] = useState<CanonicalTopic[]>([]);
  const [taxonomy, setTaxonomy] = useState<TopicTaxonomy>({ types: [], categories: [], skillsByCategory: {} });
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<TopicSort>("recent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadTopics(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    try { setTopics(await fetchCanonicalTopics(40, { type, category })); setError(""); }
    catch (e) { setTopics([]); setError(e instanceof Error ? e.message : "Topics are unavailable right now."); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { void fetchTopicTaxonomy().then(setTaxonomy).catch(() => undefined); }, []);
  useEffect(() => { void loadTopics(); }, [type, category]);

  const activeCategory = category || taxonomy.categories[0] || "";
  const visibleTopics = useMemo(() => {
    const copy = [...topics];
    if (sort === "updated" || sort === "new-posts") copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else if (sort === "trending") copy.sort((a, b) => b.replyCount - a.replyCount || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return copy;
  }, [topics, sort]);

  function selectCategory(value: string) {
    setCategory(value);
    setSort("recent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
    <header className="max-w-4xl">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">TOPICS</p>
      <h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">What people are talking about</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">Questions, experiences, local reports and opinions — organised into useful community spaces.</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link to="/topics/create" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[12px] font-medium text-primary-foreground"><Plus className="size-4" />Create a Topic</Link>
          <Link to="/topics/mine" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[12px] font-medium hover:bg-elevated">Your Topics</Link>
          <AskKurukoo prompt="Help me find a useful Topic for what I am trying to do." />
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter Topics by type" value={type} onChange={(e) => setType(e.target.value)} className="min-h-9 rounded-lg border border-border bg-background px-3 text-[11.5px]"><option value="">All types</option>{taxonomy.types.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select>
          <select aria-label="Filter Topics by category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-9 rounded-lg border border-border bg-background px-3 text-[11.5px]"><option value="">All categories</option>{taxonomy.categories.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select>
        </div>
      </div>
    </header>

    <CategoryDirectory taxonomy={taxonomy} activeCategory={activeCategory} onSelect={selectCategory} />

    {activeCategory ? <TopicRateCard category={activeCategory} /> : null}

    <div className="grid gap-3 md:grid-cols-2"><TopicAdSlot label={`${activeCategory ? pretty(activeCategory) : "Topics"} · top card slot`} /><TopicAdSlot label={`${activeCategory ? pretty(activeCategory) : "Topics"} · top card slot 2`} /></div>

    <section aria-labelledby="topic-list">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">COMMUNITY</p><h2 id="topic-list" className="mt-1.5 font-serif text-[28px] tracking-[-0.035em]">{activeCategory ? pretty(activeCategory) : "Topics"}</h2><p className="mt-1 text-[12px] text-muted-foreground">{loading ? "Loading community context…" : error || `${visibleTopics.length} ${visibleTopics.length === 1 ? "Topic" : "Topics"}`}</p></div>
        <button type="button" onClick={() => void loadTopics(true)} disabled={refreshing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium hover:bg-elevated disabled:opacity-50"><RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"}/>Refresh</button>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["recent", "updated", "trending", "new-posts"].map((value) => <button key={value} type="button" onClick={() => setSort(value as TopicSort)} className={`rounded-full px-3 py-1.5 text-[10.5px] font-medium ${sort === value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"}`}>{value === "new-posts" ? "New posts" : pretty(value)}</button>)}
      </div>
      {loading ? <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map((i) => <div key={i} className="h-44 animate-pulse rounded-[18px] border border-border bg-surface" />)}</div> : visibleTopics.length ? <div className="grid gap-3 sm:grid-cols-2">{visibleTopics.map((topic) => <TopicCard key={topic.id} topic={topic}/>)}</div> : <div className="grid gap-3 sm:grid-cols-2">{demoTopics.map((topic) => <Link key={topic.slug} to="/topics/$slug" params={{ slug: topic.slug }} className="rounded-[18px] border border-border bg-surface p-4 hover:bg-elevated/45"><p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary">COMMUNITY</p><h2 className="mt-3 text-[15.5px] font-semibold">{topic.name}</h2><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{topic.blurb}</p><p className="mt-4 text-[11px] text-muted-foreground">{topic.posts.length} replies · {topic.followers.toLocaleString()} followers</p></Link>)}</div>}
    </section>

    <TopicAdSlot large label={`${activeCategory ? pretty(activeCategory) : "Topics"} · bottom large slot`} />

    <section className="rounded-[22px] border border-border bg-elevated/35 p-5"><div className="flex items-start gap-3"><TrendingUp className="mt-0.5 size-4 shrink-0 text-primary"/><div><p className="text-[13px] font-semibold">Use a Topic when context will help.</p><p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-muted-foreground">A discussion can help you understand a situation, compare experiences or decide what to do next. When you are ready to act, bring the context into Kurukoo.</p><Link to="/explore" className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium">Explore what you can do <ArrowRight className="size-3.5"/></Link></div></div></section>

    <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-[18px] border border-border bg-surface p-4"><MessageCircle className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Start a conversation</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Ask a question or share an experience others can learn from.</p></div><div className="rounded-[18px] border border-border bg-surface p-4"><Users className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Find local context</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Browse community knowledge around places, services and everyday life.</p></div><div className="rounded-[18px] border border-border bg-surface p-4"><ShieldCheck className="size-4 text-primary"/><p className="mt-3 text-[13px] font-semibold">Keep context trustworthy</p><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Topics are community context, not proof of a provider, price or availability.</p></div></section>

    <FAQSection title="Topics questions" items={[{ question: "What are Topics?", answer: "Topics are public community conversations containing questions, experiences, local reports and opinions." }, { question: "Can a Topic prove that a provider is available?", answer: "No. Community discussion can inform a decision, but fulfilment follows its own evidence, availability and approval flow." }, { question: "Who controls Topic categories?", answer: "Categories are intended to be a stable, admin-managed taxonomy. Users choose where a discussion belongs; they do not create the platform's category structure." }]} />
  </div>;
}
