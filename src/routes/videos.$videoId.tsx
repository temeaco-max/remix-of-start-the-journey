import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { VideoCard, VideoFrame } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, FollowButton, Rows, SaveButton, SectionHeader, ShareButton } from "@/components/kurukoo/ui";
import { entityById, videoById, videos } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/videos/$videoId")({
  head: () => ({
    meta: [
      { title: "Watch — Kurukoo" },
      { name: "description", content: "Watch practical Kurukoo content and turn it into a request." },
      { property: "og:title", content: "Watch — Kurukoo" },
      { property: "og:description", content: "From watching to getting it done." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { videoId } = Route.useParams();
  const video = videoById(videoId);
  const { send } = useKurukoo();

  if (!video) {
    return (
      <>
        <PageHeader title="Watch" />
        <EmptyState title="Video not found" body="Browse creators to find something else." />
        <Link to="/creators" className="mt-4 inline-block text-[14px] underline">
          Creators
        </Link>
      </>
    );
  }

  const creator = entityById(video.creatorId);
  const related = videos.filter((v) => v.id !== video.id);

  return (
    <>
      <VideoFrame label={video.title} large className="mt-2" />
      <h1 className="mt-4 text-[22px] font-semibold">{video.title}</h1>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        {video.views} views · {video.duration}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          to="/profile/$entityId"
          params={{ entityId: video.creatorId }}
          className="flex items-center gap-2.5"
        >
          <Avatar name={creator?.name ?? "?"} size={38} />
          <span className="text-[15px]">{creator?.name}</span>
        </Link>
        <FollowButton label="Subscribe" small />
        <SaveButton />
        <ShareButton />
        <Link to="/">
          <Action variant="primary" onClick={() => send(`I watched "${video.title}" — can you sort this for me?`)}>
            Ask Kurukoo to do this
          </Action>
        </Link>
      </div>

      <section className="mt-8">
        <SectionHeader title="Discussion" />
        <Rows>
          <li className="px-4 py-3.5 text-[14px] text-muted-foreground">
            Comments open when the creator backend is connected.
          </li>
        </Rows>
      </section>

      <section className="mt-8">
        <SectionHeader title="Related" />
        <div className="grid gap-4 sm:grid-cols-2">
          {related.map((v) => (
            <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
          ))}
        </div>
      </section>

      <IntegrationGap>Playback, comments and subscriptions are placeholders.</IntegrationGap>
    </>
  );
}
