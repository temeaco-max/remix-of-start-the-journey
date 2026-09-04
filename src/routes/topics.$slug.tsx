import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { EntityCard, VideoCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { AdSlot, Avatar, FollowButton, Rows, SectionHeader } from "@/components/kurukoo/ui";
import { entities, entityById, topicBySlug, videos } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/topics/$slug")({
  head: () => ({
    meta: [
      { title: "Topic — Kurukoo" },
      {
        name: "description",
        content: "Discussions, people and providers gathered around one topic.",
      },
      { property: "og:title", content: "Topic — Kurukoo" },
      { property: "og:description", content: "Follow a topic and see who works in it." },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { slug } = Route.useParams();
  const topic = topicBySlug(slug);
  const { send } = useKurukoo();

  if (!topic) {
    return (
      <>
        <PageHeader title="Topic" />
        <EmptyState title="Topic not found" body="Browse all topics to find what you're after." />
        <Link to="/topics" className="mt-4 inline-block text-[14px] underline">
          All topics
        </Link>
      </>
    );
  }

  const related = entities.filter((e) => e.topics.some((t) => topic.slug.includes(t)));
  const topicVideos = videos.filter((v) => v.topic === topic.slug);

  return (
    <>
      <PageHeader title={topic.name} subtitle={topic.blurb} />
      <div className="flex flex-wrap items-center gap-3">
        <FollowButton label="Follow topic" />
        <span className="text-[13px] text-muted-foreground">
          {topic.followers.toLocaleString()} following
        </span>
        <Link to="/">
          <Action onClick={() => send(`Tell me about ${topic.name.toLowerCase()}.`)}>
            Open in chat
          </Action>
        </Link>
      </div>

      <section className="mt-8">
        <SectionHeader title="Discussion" subtitle="What people are saying." />
        <Rows>
          {topic.posts.map((p) => (
            <li key={p.id} className="flex gap-3 px-4 py-3.5">
              <Avatar name={p.author} size={34} />
              <div className="min-w-0">
                <p className="text-[14px] font-medium">
                  {p.author} <span className="font-normal text-muted-foreground">· {p.when}</span>
                </p>
                <p className="mt-0.5 text-[14.5px]">{p.text}</p>
              </div>
            </li>
          ))}
        </Rows>
      </section>

      {related.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title="People and providers" subtitle="Working in this topic." />
          <div className="grid gap-3">
            {related.slice(0, 3).map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        </section>
      ) : null}

      {topicVideos.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title="Watch" />
          <div className="grid gap-4 sm:grid-cols-2">
            {topicVideos.map((v) => (
              <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <AdSlot
          placement="Topic feed"
          headline="Local boiler servicing, booked this week"
          body="A sponsored placement slot. Real campaigns will fill this from the advertising backend."
          advertiser="Example advertiser"
        />
      </div>

      <IntegrationGap>
        Following, posting and moderation are visual only in this prototype.
      </IntegrationGap>
    </>
  );
}
