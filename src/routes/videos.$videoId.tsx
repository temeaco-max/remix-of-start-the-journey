import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock3, Eye, Play, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { SectionHeader } from "@/components/kurukoo/ui";
import { VideoCard } from "@/components/kurukoo/cards";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass, DemoDataBadge } from "@/components/kurukoo/primitives";
import { entityById, topicBySlug, videoById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/videos/$videoId")({
  head: () => ({
    meta: [
      { title: "Watch — Kurukoo" },
      {
        name: "description",
        content: "A useful video, connected to the Topic it is about.",
      },
    ],
  }),
  component: VideoDetailPage,
});

function VideoDetailPage() {
  const { videoId } = Route.useParams();
  const video = videoById(videoId);
  if (!video) {
    return (
      <div className="space-y-7 pb-12">
        <PageHeader eyebrow="Watch" title="Video not found" subtitle="This video may have been moved or is not available yet." />
        <Link to="/videos" className={actionClass()}>
          Back to Watch
        </Link>
      </div>
    );
  }
  const creator = entityById(video.creatorId);
  const topic = topicBySlug(video.topic);
  const related = videos.filter((v) => v.id !== video.id && v.topic === video.topic).slice(0, 3);

  return (
    <div className="space-y-7 pb-12">
      <DemoDataBadge />
      <PageHeader
        eyebrow="Watch"
        title={video.title}
        subtitle={`Useful creator content connected to Topics and things people are trying to get done.`}
      />
      <section className="rounded-2xl border border-border bg-elevated/35 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-brand-ink">
            <Play className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Kurukoo Watch
            </p>
            <h2 className="mt-1.5 font-serif text-[28px] leading-tight">{video.title}</h2>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              {creator?.name ?? "A Kurukoo creator"} · {video.duration} · {video.views} views
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AskKurukoo
                prompt={`I just watched "${video.title}". Help me turn what I learned into an action.`}
              />
              <Link to="/videos" className={actionClass()}>
                Back to Watch <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-7">
        <SectionHeader
          title="About this video"
          subtitle="Creator content stays connected to the Topic it is about, so you can keep useful context and take the next step."
        />
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-surface">
              <Clock3 className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">Watch {video.duration}</p>
              <p className="text-[11.5px] text-muted-foreground">
                {video.views} views
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-surface">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">Creator</p>
              <p className="text-[11.5px] text-muted-foreground">
                {creator?.name ?? "A Kurukoo creator"}
              </p>
            </div>
          </div>
          {topic ? (
            <Link to="/topics/$slug" params={{ slug: topic.slug }} className="inline-flex items-center gap-2 text-[12px] font-medium text-primary underline">
              Open its Topic — {topic.name}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </section>
      <section className="mt-7">
        <SectionHeader title="Related videos" subtitle="More from this Topic or the same creator." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((v) => (
            <VideoCard key={v.id} video={v} creatorName={entityById(v.creatorId)?.name ?? ""} />
          ))}
        </div>
      </section>
    </div>
  );
}
