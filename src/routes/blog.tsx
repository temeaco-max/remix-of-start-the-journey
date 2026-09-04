import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { Rows } from "@/components/kurukoo/ui";
import { articles } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Kurukoo" },
      { name: "description", content: "Notes on building an assistant that actually gets things done." },
      { property: "og:title", content: "Blog — Kurukoo" },
      { property: "og:description", content: "Writing about handover, trust and coordination." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <MarketingPage>
      <PageHeader title="Blog" subtitle="How we think about handing work over." />
      <Rows>
        {articles.map((a) => (
          <li key={a.slug}>
            <Link to="/blog/$slug" params={{ slug: a.slug }} className="block px-4 py-4 hover:bg-elevated/60">
              <p className="text-[15px] font-medium">{a.title}</p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{a.excerpt}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{a.date}</p>
            </Link>
          </li>
        ))}
      </Rows>
    </MarketingPage>
  );
}
