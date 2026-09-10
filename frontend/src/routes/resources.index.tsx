import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BookOpen, Compass, MemoryStick, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";
import { fetchResourcesList, isKurukooApiConfigured, type ResourceGuide } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/resources/")({
  head: () => ({ meta: [
    { title: "Resources & guides — Kurukoo" },
    { name: "description", content: "Short guides and educational resources for getting more from Kurukoo — for everyone, providers, businesses and contributors." },
    { property: "og:title", content: "Resources & guides — Kurukoo" },
    { property: "og:description", content: "Learn how Kurukoo works through need-led guidance and detailed guides." },
  ], links: [{ rel: "canonical", href: "/resources" }] }),
  component: ResourcesPage,
});

const AUDIENCE_HUBS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "For everyone",
    links: [
      ["/how-it-works", "How Kurukoo works"],
      [`/chat?prompt=${encodeURIComponent("What can I ask Kurukoo?")}`, "What can I ask?"],
      ["/pricing", "Understanding Points & fulfilment"],
      ["/safety", "Trust & safety"],
    ],
  },
  {
    title: "For providers",
    links: [
      [`/chat?prompt=${encodeURIComponent("I want to become a provider")}`, "Become a provider"],
      [`/chat?prompt=${encodeURIComponent("How do skills work?")}`, "Skills & capabilities"],
      [`/chat?prompt=${encodeURIComponent("How do I get paid?")}`, "Getting paid"],
    ],
  },
  {
    title: "For businesses",
    links: [
      [`/chat?prompt=${encodeURIComponent("I want to onboard my business")}`, "Business onboarding"],
      [`/chat?prompt=${encodeURIComponent("How do I sync my catalog?")}`, "Catalog syncing"],
      ["/partners", "Partnering with Kurukoo"],
    ],
  },
  {
    title: "For contributors",
    links: [
      [`/chat?prompt=${encodeURIComponent("I want to be a contributor")}`, "Contributor programme"],
      [`/chat?prompt=${encodeURIComponent("Tell me about ambassador rewards")}`, "Ambassador rewards"],
    ],
  },
];

const NEED_STARTERS: Array<[string, string]> = [
  [`/chat?prompt=${encodeURIComponent("I need food or groceries")}`, "Food and groceries"],
  [`/chat?prompt=${encodeURIComponent("I need a repair")}`, "Repairs and maintenance"],
  [`/chat?prompt=${encodeURIComponent("Help me find work")}`, "Work and tasks"],
  [`/chat?prompt=${encodeURIComponent("Remind me about something")}`, "Reminders"],
];

function HubLink(href: string, label: string) {
  const internal = href.startsWith("/") && !href.startsWith("/chat?");
  const arrow = <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
  if (internal) {
    return (
      <Link key={label} to={href} className="group flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-[12.5px] font-medium transition-colors hover:border-border hover:bg-elevated">
        <span className="min-w-0 flex-1 truncate">{label}</span>{arrow}
      </Link>
    );
  }
  return (
    <a key={label} href={href} className="group flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-[12.5px] font-medium transition-colors hover:border-border hover:bg-elevated">
      <span className="min-w-0 flex-1 truncate">{label}</span>{arrow}
    </a>
  );
}

function GuidesGrid() {
  const [resources, setResources] = useState<ResourceGuide[]>([]); const [loading, setLoading] = useState(isKurukooApiConfigured());
  useEffect(() => {
    if (!isKurukooApiConfigured()) { setLoading(false); return; }
    let cancelled = false;
    fetchResourcesList()
      .then((payload) => { if (!cancelled) setResources(Array.isArray(payload.resources) ? payload.resources : []); })
      .catch(() => { if (!cancelled) setResources([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-elevated/50"/>)}</div>;
  if (!resources.length) return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
      <BookOpen className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-[14px] font-medium">Guides are being prepared.</p>
      <p className="mt-1 text-[12px] text-muted-foreground">You can ask Kurukoo directly instead.</p>
      <div className="mt-4"><AskKurukoo prompt="Show me how to use Kurukoo." /></div>
    </div>
  );
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Kurukoo resource guides">
      {resources.map((resource) => (
        <Link key={resource.slug} to="/resources/$slug" params={{ slug: resource.slug }} className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground"><BookOpen className="size-4" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-primary">{resource.category}</p>
              <h2 className="mt-1 text-[14px] font-semibold leading-snug">{resource.title}</h2>
              <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted-foreground">{resource.excerpt}</p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </Link>
      ))}
    </section>
  );
}

function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-9 pb-10">
      <header className="max-w-3xl">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">Knowledge & Guides</p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[50px]">How Kurukoo works for you</h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-muted-foreground">Educational resources to help you get the most out of Kurukoo.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <AskKurukoo prompt="Help me find the right Kurukoo resource." />
          <Link to="/how-it-works" className={actionClass()}>How it works</Link>
        </div>
      </header>

      <section aria-labelledby="audience-hub">
        <div className="mb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Start with the need, not a category</p>
          <h2 id="audience-hub" className="mt-1.5 font-serif text-[29px] leading-[1.05] tracking-[-0.035em]">Guidance for the ways you use Kurukoo</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {AUDIENCE_HUBS.map((hub) => (
            <section key={hub.title} className="rounded-[19px] border border-border bg-surface p-5">
              <h3 className="text-[13.5px] font-semibold">{hub.title}</h3>
              <div className="mt-3 flex flex-col gap-2">
                {hub.links.map(([href, label]) => HubLink(href, label))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Begin a conversation</p>
          <h2 className="mt-1.5 font-serif text-[29px] leading-[1.05] tracking-[-0.035em]">Start with the need.</h2>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">These examples help you begin a conversation without choosing the service, provider or category first.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NEED_STARTERS.map(([href, label]) => (
            <a key={label} href={href} className="flex min-h-10 items-center justify-between gap-1.5 rounded-xl border border-border bg-elevated/35 px-3 text-[12px] font-medium transition-colors hover:bg-elevated">
              <span className="min-w-0 flex-1 truncate">{label}</span><ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-border bg-elevated/35 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><MemoryStick className="size-5" aria-hidden="true" /></span>
          <div>
            <h2 className="text-[15px] font-semibold">Living memory, useful context, under your control.</h2>
            <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">Learn what Kurukoo can remember, how provenance works, and how to edit or forget connected context.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HubLink("/memory", "Review memory in your workspace")}
              <Link to="/legal/privacy" className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-elevated"><span className="min-w-0 flex-1 truncate">Read privacy guidance</span><ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Learn by seeing how it works</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Guides</span>
        </div>
        <h2 className="mt-1.5 font-serif text-[29px] leading-[1.05] tracking-[-0.035em]">Latest detailed guides</h2>
        <div className="mt-4"><GuidesGrid /></div>
      </section>

      <FAQSection items={[
        { question: "What are Kurukoo Resources?", answer: "Resources are short educational guides that explain how to use Kurukoo for real tasks, plus need-led starting points that continue into Chat." },
        { question: "Do I need to pick a category first?", answer: "No. Start with the need — food, repairs, work, reminders — and Kurukoo helps from there without a forced category." },
        { question: "Can I ask Kurukoo instead?", answer: "Yes. Chat is the quickest route when you would rather describe what you are trying to do and let Kurukoo guide the next step." },
      ]} />
    </div>
  );
}
