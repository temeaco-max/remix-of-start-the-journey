import { Link } from "@tanstack/react-router";
import { Play, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const videos = [
  ["How people use Kurukoo", "Kurukoo · 1:12"],
  ["From ask to action", "Creator · 0:48"],
  ["A day moving with Kurukoo", "Community · 1:36"],
  ["Building a useful request", "Kurukoo · 0:57"],
] as const;

function PublicAdvert() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#e9e0d6] p-3.5 dark:bg-elevated">
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-[#f7efe8] blur-2xl dark:bg-background" />
      <div className="relative">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Kurukoo Advertising
        </p>
        <p className="mt-1.5 text-[12px] font-semibold tracking-tight">
          Useful discovery, not noise.
        </p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
          Relevant services, offers and ideas can appear in context.
        </p>
        <Link
          to="/advertising"
          className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium"
        >
          Learn more <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

export function PublicContextRail() {
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setVideoIndex((value) => (value + 1) % videos.length),
      5000,
    );

    return () => window.clearInterval(timer);
  }, []);

  const activities = [
    ["Request", "Someone found a verified plumber", "just now"],
    ["Explore", "A creator shared a useful local guide", "2m"],
    ["Opportunity", "A new collaboration opportunity opened", "5m"],
    ["Work", "A task moved into coordination", "8m"],
  ] as const;

  return (
    <aside
      aria-label="Kurukoo public context rail"
      className="hidden w-[224px] shrink-0 flex-col overflow-y-auto border-l border-[#e7e0d7] bg-[#f5f1eb] px-3 py-4 lg:flex dark:border-border dark:bg-background"
    >
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="size-[14px] text-muted-foreground" />
            <h2 className="text-[13px] font-semibold">Recent videos</h2>
          </div>
          <span className="text-[9px] text-muted-foreground">
            {videoIndex + 1}/{videos.length}
          </span>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#d9cec2]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f3e9df] via-[#cfc2b5] to-[#a99b8d]" />
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-9 place-items-center rounded-full bg-background/85 shadow-sm">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3 pt-8 text-background">
            <p className="text-[11px] font-semibold leading-snug">
              {videos[videoIndex][0]}
            </p>
            <p className="mt-0.5 text-[9px] opacity-80">
              {videos[videoIndex][1]}
            </p>
          </div>
        </div>

        <div className="mt-2 flex gap-1">
          {videos.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show video ${index + 1}`}
              aria-current={index === videoIndex ? "true" : undefined}
              onClick={() => setVideoIndex(index)}
              className={`h-1 flex-1 rounded-full ${index === videoIndex ? "bg-foreground" : "bg-border"}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-[#fbfaf7] p-3 dark:bg-surface">
        <div className="flex items-center gap-2">
          <Zap className="size-[15px] text-muted-foreground" />
          <h2 className="text-[13px] font-semibold">Activity</h2>
        </div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
          A glimpse of what people are doing — and what Kurukoo can proactively
          open up.
        </p>
        <div className="mt-2.5 space-y-2">
          {activities.map(([type, text, time]) => (
            <div key={text} className="flex gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-[10.5px] leading-snug">
                  <span className="font-medium">{type}</span> · {text}
                </p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <PublicAdvert />
      </section>

      <section className="mt-auto pt-5">
        <div className="rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 dark:border-border dark:bg-surface">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-[15px] text-muted-foreground" />
            <h2 className="text-[13px] font-semibold">Trusted by design</h2>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              No invented availability or pricing. Useful provider information is
              grounded in evidence.
            </p>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Kurukoo asks before making commitments on your behalf.
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}
