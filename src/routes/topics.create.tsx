import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check, Copy, MessageCircle, Share2, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { fetchTopicTaxonomy, isKurukooApiConfigured, submitCanonicalTopic, type CanonicalTopic, type TopicTaxonomy } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/topics/create")({
  head: () => ({
    meta: [
      { title: "Create a Topic — Kurukoo" },
      { name: "description", content: "Start a moderated public Topic on Kurukoo and share useful community context." },
      { property: "og:title", content: "Create a Topic — Kurukoo" },
      { property: "og:description", content: "Start a moderated public Topic on Kurukoo." },
    ],
  }),
  component: CreateTopicPage,
});

function pretty(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ShareTopic({ topic }: { topic: CanonicalTopic }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const path = `/topics/${topic.slug}`;
  const canShare = topic.publishedAt !== null || topic.status.toLowerCase() === "published" || topic.status.toLowerCase() === "active";

  async function copyLink() {
    try {
      const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (!canShare) return;
    const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: topic.title, text: topic.body, url });
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }

  if (!canShare) {
    return <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">Your Topic has been submitted for moderation. It will become shareable here once it is approved for public view.</p>;
  }

  return <div className="mt-5 flex flex-wrap gap-2">
    <button type="button" onClick={() => void share()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90"><Share2 className="size-3.5" />{shared ? "Shared" : "Share Topic"}</button>
    <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[12.5px] font-medium hover:bg-elevated"><Copy className="size-3.5" />{copied ? "Link copied" : "Copy link"}</button>
  </div>;
}

function CreateTopicPage() {
  const [taxonomy, setTaxonomy] = useState<TopicTaxonomy>({ types: [], categories: [], skillsByCategory: {} });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [lga, setLga] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CanonicalTopic | null>(null);

  useEffect(() => { void fetchTopicTaxonomy().then((nextTaxonomy) => {
    setTaxonomy(nextTaxonomy);
    setType(nextTaxonomy.types[0] ?? "");
    setCategory(nextTaxonomy.categories[0] ?? "");
  }).catch(() => undefined); }, []);

  const availableSkills = useMemo(() => taxonomy.skillsByCategory[category] ?? [], [category, taxonomy.skillsByCategory]);

  useEffect(() => {
    setSkills((current) => current.filter((skill) => availableSkills.includes(skill)));
  }, [availableSkills]);

  function toggleSkill(skill: string) {
    setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isKurukooApiConfigured()) {
      setError("Topic creation is connected to Kurukoo's canonical service. The frontend backend connection is not configured in this environment yet.");
      return;
    }
    if (!title.trim() || !body.trim() || !type) {
      setError("Add a title, a useful description and a Topic type before publishing.");
      return;
    }

    setSubmitting(true);
    try {
      const topic = await submitCanonicalTopic({
        title: title.trim(),
        body: body.trim(),
        type,
        category: category || undefined,
        skills,
        city: city.trim() || undefined,
        lga: lga.trim() || undefined,
      });
      setCreated(topic);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Topic could not be created right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const publicReady = created.publishedAt !== null || created.status.toLowerCase() === "published" || created.status.toLowerCase() === "active";
    return <div className="w-full max-w-3xl">
      <Link to="/topics" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Topics</Link>
      <section className="mt-8 max-w-2xl">
        <span className="grid size-11 place-items-center rounded-2xl bg-elevated"><Check className="size-5" /></span>
        <p className="mt-5 text-[12px] font-medium text-muted-foreground">{publicReady ? "Topic published" : "Topic submitted"}</p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.04] tracking-[-0.045em] md:text-[52px]">{created.title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{publicReady ? "Your Topic is now part of the public conversation. Share it, invite useful replies and bring the context into Kurukoo when you need to act." : "Your Topic has been accepted by the canonical Topic service and is awaiting moderation before it becomes public."}</p>
        <ShareTopic topic={created} />
        {publicReady ? <Link to="/topics/$slug" params={{ slug: created.slug }} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:opacity-80">Open Topic <ArrowUpRight className="size-3.5" /></Link> : null}
      </section>
      <Panel className="mt-8 p-5">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-[13px] font-medium">Keep the Topic useful</p><p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">Community context can inform people, but it is never treated as proof of provider availability, pricing, stock, bookings or fulfilment.</p></div></div>
      </Panel>
    </div>;
  }

  return <div className="w-full max-w-3xl">
    <Link to="/topics" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Topics</Link>
    <section className="mt-5 max-w-2xl">
      <p className="text-[12px] font-medium text-muted-foreground">Create a Topic</p>
      <h1 className="mt-2 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[54px]">Start a conversation that can become useful context.</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">Share a question, experience, local report or useful opinion. Topics are moderated before they become part of the public community record.</p>
    </section>

    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Panel className="p-5">
        <div className="space-y-4">
          <div><label htmlFor="topic-title" className="text-[12.5px] font-medium">Title</label><input id="topic-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="What do you want people to discuss?" className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[14px] outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" required /></div>
          <div><label htmlFor="topic-body" className="text-[12.5px] font-medium">What would you like to share?</label><textarea id="topic-body" value={body} onChange={(event) => setBody(event.target.value)} rows={7} maxLength={8000} placeholder="Give people enough context to understand the question or experience." className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3.5 text-[13.5px] leading-relaxed outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" required /><div className="mt-1 text-right text-[10.5px] text-muted-foreground">{body.length}/8000</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="topic-type" className="text-[12.5px] font-medium">Topic type</label><select id="topic-type" value={type} onChange={(event) => setType(event.target.value)} className="mt-2 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none">{!taxonomy.types.length ? <option value="">Choose a type</option> : null}{taxonomy.types.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select></div>
            <div><label htmlFor="topic-category" className="text-[12.5px] font-medium">Category</label><select id="topic-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none"><option value="">No category</option>{taxonomy.categories.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select></div>
          </div>
          {availableSkills.length ? <div><p className="text-[12.5px] font-medium">Useful skills in this category</p><div className="mt-2 flex flex-wrap gap-2">{availableSkills.map((skill) => <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`rounded-full border px-2.5 py-1.5 text-[11.5px] transition-colors ${skills.includes(skill) ? "border-primary/40 bg-elevated text-foreground" : "border-border text-muted-foreground hover:bg-elevated"}`}>{pretty(skill)}</button>)}</div></div> : null}
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="topic-city" className="text-[12.5px] font-medium">City <span className="font-normal text-muted-foreground">(optional)</span></label><input id="topic-city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="e.g. Lagos" className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13px] outline-none" /></div><div><label htmlFor="topic-lga" className="text-[12.5px] font-medium">Local area <span className="font-normal text-muted-foreground">(optional)</span></label><input id="topic-lga" value={lga} onChange={(event) => setLga(event.target.value)} maxLength={100} placeholder="e.g. Yaba" className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13px] outline-none" /></div></div>
        </div>
      </Panel>

      <Panel className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-[13px] font-medium">Public by design, moderated before view</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Do not add private contact details, precise home addresses, credentials or claims you cannot support. A Topic is community context — not fulfilment proof.</p></div></div></Panel>

      {error ? <div role="alert" className="rounded-xl border border-border bg-elevated/60 px-4 py-3 text-[12.5px] leading-relaxed text-foreground">{error}</div> : null}
      <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={submitting || !title.trim() || !body.trim() || !type} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle className="size-4" />{submitting ? "Publishing…" : "Create Topic"}</button><Link to="/topics" className="inline-flex min-h-10 items-center px-3 text-[12.5px] text-muted-foreground hover:text-foreground">Cancel</Link></div>
    </form>
  </div>;
}
