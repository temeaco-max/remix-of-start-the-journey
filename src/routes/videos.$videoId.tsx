import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { VideoCard, VideoFrame } from "@/components/kurukoo/cards";
import { Avatar } from "@/components/kurukoo/ui";
import { entityById, videoById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/videos/$videoId")({
  head: () => ({ meta: [{ title: "Watch — Kurukoo" }] }),
  component: WatchPage,
});

function WatchPage() {
  const { videoId } = Route.useParams();
  const video = videoById(videoId);

  if (!video) {
    return (
      <div className="space-y-4">
        <Link to="/videos" className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ArrowLeft className="size-3.5" /> Videos
        </Link>
        <h1 className="text-xl font-semibold">Video not found</h1>
      </div>
    );
  }

  const creator = entityById(video.creatorId);
  const related = videos.filter((item) => item.id !== video.id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/videos" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> How-to videos
      </Link>
      <VideoFrame label={video.title} large className="rounded-[20px]" />
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight">{video.title}</h1>
        <div className="mt-2 flex items-center gap-2.5 text-[12px] text-muted-foreground">
          <Avatar name={creator?.name ?? "Kurukoo"} size={28} />
          <span>{creator?.name ?? "Kurukoo"}</span>
          <span>·</span>
          <span>{video.duration}</span>
          <span>·</span>
          <span>{video.views} views</span>
        </div>
      </header>
      <Link
        to="/chat"
        search={{ query: `Help me with ${video.title}` } as never}
        className="inline-flex min-h-9 items-center rounded-xl bg-primary px-3.5 text-[11.5px] font-medium text-primary-foreground"
      >
        Ask Kurukoo about this
      </Link>
      <section className="pt-3">
        <h2 className="mb-3 text-[15px] font-semibold">More to watch</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {related.map((item) => (
            <VideoCard key={item.id} video={item} creatorName={entityById(item.creatorId)?.name ?? ""} />
          ))}
        </div>
      </section>
    </div>
  );
}
