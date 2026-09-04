import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { TopicCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { topics } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/topics")({
  head: () => ({
    meta: [
      { title: "Topics — Kurukoo" },
      {
        name: "description",
        content: "Follow topics to see discussions, people and providers around them.",
      },
      { property: "og:title", content: "Topics — Kurukoo" },
      { property: "og:description", content: "Discussions and providers grouped by subject." },
    ],
  }),
  component: TopicsPage,
});

function TopicsPage() {
  return (
    <>
      <PageHeader
        title="Topics"
        subtitle="Follow a subject to see discussions and who works in it."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <TopicCard key={t.slug} topic={t} />
        ))}
      </div>
      <IntegrationGap>
        Topic content is demo material. Ranking, moderation and persistence arrive with the backend.
      </IntegrationGap>
    </>
  );
}
