import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { VideoCard } from "@/components/kurukoo/cards";
import { videos, entityById } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Guide videos — Kurukoo" }] }),
  component: VideosPage,
});

function VideosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Home
      </Link>
      <header className="max-w-2xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Guides</p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight">How-to videos</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Watch when you want a visual explanation.</p>
      </header>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const creator = entityById(video.creatorId);
          return creator ? <VideoCard key={video.id} video={video} creatorName={creator.name} /> : null;
        })}
      </section>
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
        Back to Explore <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}
