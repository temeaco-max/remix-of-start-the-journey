import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";

type Resource = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  updated_at?: string;
};

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Resources — Kurukoo" }] }),
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
        if (!cancelled) setResources(payload.resources ?? []);
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Learn Kurukoo</p>
          <h1 className="mt-1.5 text-[30px] font-semibold tracking-tight">Resources</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Short guides for getting more from Kurukoo.
          </p>
        </div>
        <AskKurukoo prompt="Show me how to get the most out of Kurukoo." />
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading resources">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-elevated/50" />
          ))}
        </div>
      ) : resources.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Kurukoo resources">
          {resources.map((resource) => (
            <Link
              key={resource.slug}
              to="/resources/$slug"
              params={{ slug: resource.slug }}
              className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground">
                  <BookOpen className="size-4" />
                </span>
                <div className="min-w-0">
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

      <Link to="/videos" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
        <MessageCircle className="size-3.5" />
        Browse visual guides
      </Link>
    </div>
  );
}
