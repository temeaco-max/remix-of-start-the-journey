import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { Action } from "@/components/kurukoo/primitives";
import { articleBySlug } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Article — Kurukoo" },
      { name: "description", content: "An article from the Kurukoo blog." },
      { property: "og:title", content: "Article — Kurukoo" },
      { property: "og:description", content: "An article from the Kurukoo blog." },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const article = articleBySlug(slug);

  if (!article) {
    return (
      <MarketingPage>
        <PageHeader title="Article" />
        <EmptyState title="Article not found" body="This piece may have moved or been renamed." />
        <div className="mt-4">
          <Link to="/blog">
            <Action>Back to the blog</Action>
          </Link>
        </div>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <PageHeader title={article.title} subtitle={article.date} />
      <article className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        {article.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/blog">
          <Action>All articles</Action>
        </Link>
        <Link to="/">
          <Action variant="primary">Ask Kurukoo</Action>
        </Link>
      </div>
    </MarketingPage>
  );
}
