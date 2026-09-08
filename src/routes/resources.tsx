import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";

type Resource = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  updated_at?: string | null;
};

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Kurukoo resources and visual guides" },
      { name: "description", content: "Short guides and visual explanations for getting more from Kurukoo." },
      { property: "og:title", content: "Kurukoo resources and visual guides" },
      { property: "og:description", content: "Learn how to use Kurukoo through short guides and visual explanations." },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/resources")
      .then((response) => {
        if (!response.ok) throw new Error("Resources unavailable");
        return response.json() as Promise<{ resources?: Resource[] }>;
      })
      .then((payload) => {
        if (!cancelled) setResources(Array.isArray(payload.resources) ? payload.resources : []);
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Learn Kurukoo</p>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[50px]">Resources</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">Short guides and visual explanations for getting more from Kurukoo.</p>
        </div>
        <AskKurukoo prompt="Show me how to get the most out of Kurukoo." />
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading resources">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-elevated/50" />)}
        </div>
      ) : resources.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Kurukoo resources">
          {resources.map((resource) => (
            <Link key={resource.slug} to="/resources/$slug" params={{ slug: resource.slug }} className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground"><BookOpen className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{resource.category}</p>
                  <h2 className="mt-1 text-[14px] font-semibold leading-snug">{resource.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted-foreground">{resource.excerpt}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <BookOpen className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-[14px] font-medium">Resources are being prepared.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">You can ask Kurukoo directly instead.</p>
          <AskKurukoo prompt="Show me how to use Kurukoo." className="mt-4" />
        </div>
      )}

      <FAQSection
        items={[
          { question: "What are Kurukoo Resources?", answer: "Resources are short educational guides that explain how to use Kurukoo for real tasks. They are a supporting content layer, not a separate product surface." },
          { question: "Will there be visual guides?", answer: "Yes. Visual and how-to content can be surfaced alongside the written guide so you can see the flow rather than reading a long technical explanation." },
          { question: "Can I ask Kurukoo instead of reading a guide?", answer: "Yes. Chat remains the quickest route when you would rather describe what you are trying to do and let Kurukoo guide the next step." },
        ]}
      />
    </div>
  );
}
