import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Action } from "@/components/kurukoo/primitives";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { MarketingPage } from "@/components/kurukoo/marketing";

type BlogArticle = {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
};

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Article — Kurukoo" },
      { name: "description", content: "An article from the Kurukoo journal." },
      { property: "og:title", content: "Kurukoo article" },
      { property: "og:description", content: "Notes and useful context from Kurukoo." },
    ],
  }),
  component: ArticlePage,
});

function cleanArticleHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function formatArticleDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setArticle(null);
    setLoading(true);
    void fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Article unavailable");
        return response.json() as Promise<BlogArticle>;
      })
      .then((payload) => {
        if (!cancelled) setArticle(payload);
      })
      .catch(() => {
        if (!cancelled) setArticle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return (
    <MarketingPage>
      {loading ? (
        <article className="mx-auto w-full max-w-3xl space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-elevated" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-elevated" />
          <div className="h-64 animate-pulse rounded-2xl bg-elevated" />
        </article>
      ) : !article ? (
        <article className="mx-auto w-full max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Blog
          </Link>
          <div className="mt-10 text-center">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              Article unavailable
            </p>
            <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[50px]">
              This piece isn’t available.
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
              The article may have moved or is not available right now.
            </p>
            <div className="mt-6">
              <Link to="/blog">
                <Action>
                  <ArrowLeft className="size-3.5" />
                  Back to the blog
                </Action>
              </Link>
            </div>
          </div>
        </article>
      ) : (
        <article className="mx-auto w-full max-w-3xl pb-14">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Blog
          </Link>
          <header className="mt-6 border-b border-border pb-8">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="text-primary">{article.category}</span>
              <span>·</span>
              <span>{formatArticleDate(article.date)}</span>
              <span>·</span>
              <span>{article.author}</span>
            </div>
            <h1 className="mt-3 font-serif text-[44px] leading-[1.01] tracking-[-0.05em] md:text-[58px]">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                {article.excerpt}
              </p>
            ) : null}
          </header>
          <div className="mt-8 space-y-5">
            <div
              className="prose prose-neutral max-w-none text-[15px] leading-7 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: cleanArticleHtml(article.content) }}
            />
          </div>
          <footer className="mt-10 border-t border-border pt-7">
            <div className="flex flex-wrap gap-2">
              <AskKurukoo prompt={`Help me understand this Kurukoo article: ${article.title}.`} />
              <Link
                to="/explore"
                className="inline-flex min-h-9 items-center gap-1.5 border border-border px-3 text-[12px] font-medium hover:bg-elevated"
              >
                Explore <ArrowUpRight className="size-3.5" />
              </Link>
              <Link to="/blog">
                <Action>More from the journal</Action>
              </Link>
            </div>
          </footer>
        </article>
      )}
    </MarketingPage>
  );
}
