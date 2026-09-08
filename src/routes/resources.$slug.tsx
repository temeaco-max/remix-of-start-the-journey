import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";

type Resource = {
  slug: string;
  title: string;
  category: string;
  body: string;
  excerpt: string;
  updated_at?: string | null;
};

export const Route = createFileRoute("/resources/$slug")({
  head: () => ({ meta: [{ title: "Resource — Kurukoo" }] }),
  component: ResourcePage,
});

function ResourcePage() {
  const { slug } = Route.useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/resources/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Resource unavailable");
        return response.json() as Promise<Resource>;
      })
      .then((payload) => {
        if (!cancelled) setResource(payload);
      })
      .catch(() => {
        if (!cancelled) setResource(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-5 w-24 rounded bg-elevated" /><div className="h-10 w-2/3 rounded bg-elevated" /><div className="h-56 rounded-2xl bg-elevated" /></div>;
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-[22px] font-semibold">That guide isn’t available.</h1>
        <Link to="/resources" className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-primary">Back to Resources <ArrowUpRight className="size-3.5" /></Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-7">
      <Link to="/resources" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Resources
      </Link>
      <header className="border-b border-border/70 pb-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{resource.category}</p>
        <h1 className="mt-1.5 text-[30px] font-semibold tracking-tight">{resource.title}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{resource.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AskKurukoo prompt={`Help me with the guide “${resource.title}”.`} />
          <Link to="/explore" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium hover:bg-elevated">Explore <ArrowUpRight className="size-3.5" /></Link>
        </div>
      </header>
      <div className="prose prose-neutral max-w-none text-[14px] leading-7 dark:prose-invert" dangerouslySetInnerHTML={{ __html: resource.body }} />
    </article>
  );
}
