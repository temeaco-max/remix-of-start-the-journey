import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthMode } from "@/components/kurukoo/auth";
import { fetchCanonicalTopics, type CanonicalTopic } from "@/lib/kurukoo-api";

const videoScenes = [
  {
    title: "I need someone to fix my phone.",
    answer: "Kurukoo finds useful options and keeps you in control.",
    label: "Say it plainly",
    creator: "Kurukoo",
  },
  {
    title: "Repair · iPhone 15 · Southampton",
    answer: "Useful, verified options are brought into view.",
    label: "Kurukoo works",
    creator: "Kurukoo",
  },
  {
    title: "PhoneCare · £79 · Tomorrow 14:00",
    answer: "Ready to review — nothing is booked without you.",
    label: "You decide",
    creator: "Kurukoo",
  },
  {
    title: "Repair confirmed with your approval.",
    answer: "The request trail stays with you after the result.",
    label: "Useful result",
    creator: "Kurukoo",
  },
] as const;

const activityItems = [
  ["Request", "A verified local provider was found", "now"],
  ["Explore", "Someone discovered a useful place nearby", "2m"],
  ["Opportunity", "A collaboration was surfaced proactively", "5m"],
  ["Work", "A task moved into coordination", "8m"],
  ["Topic", "A new discussion started nearby", "11m"],
  ["Creator", "A useful local guide was published", "14m"],
] as const;

function SearchBox() {
  return (
    <form
      action="/explore"
      method="get"
      className="rounded-xl border border-border bg-surface p-2.5 shadow-[var(--shadow-soft)]"
    >
      <label htmlFor="public-context-search" className="sr-only">
        Search Kurukoo
      </label>
      <div className="flex items-center gap-2">
        <Search className="size-4 shrink-0 text-primary" />
        <input
          id="public-context-search"
          name="query"
          placeholder="Search Kurukoo"
          className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-elevated text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </form>
  );
}

function PublicVideoCarousel() {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setSlide((value) => (value + 1) % videoScenes.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [playing]);

  const scene = videoScenes[slide] ?? videoScenes[0];
  return (
    <div className="overflow-hidden rounded-[22px] border border-border bg-foreground text-background shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[9/13] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,color-mix(in_oklch,var(--brand-tint)_70%,transparent),transparent_30%),radial-gradient(circle_at_24%_78%,color-mix(in_oklch,var(--brand-ink)_24%,transparent),transparent_32%),linear-gradient(145deg,var(--foreground),color-mix(in_oklch,var(--foreground)_78%,var(--primary)))]" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="rounded-full bg-background/15 px-2 py-1 text-[9px] font-semibold tracking-wide text-background/80 backdrop-blur">
            KURUKOO · DEMO
          </span>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause showcase" : "Play showcase"}
            className="grid size-7 place-items-center rounded-full bg-background/15 backdrop-blur"
          >
            {playing ? <Pause className="size-3" /> : <Play className="ml-0.5 size-3" />}
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground via-foreground/35 to-transparent px-3 pb-3 pt-24">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-background/55">
            {scene.creator}
          </p>
          <p className="mt-1.5 text-[16px] font-semibold leading-tight text-background">
            {scene.title}
          </p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-background/75">{scene.answer}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9.5px] font-semibold text-background">{scene.label}</span>
            <div className="flex gap-1">
              {videoScenes.map((item, dot) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => setSlide(dot)}
                  aria-label={`Show showcase scene ${dot + 1}`}
                  className="h-1.5 w-6 overflow-hidden rounded-full bg-background/20"
                >
                  <span
                    className={
                      dot === slide
                        ? "block h-full w-full rounded-full bg-primary"
                        : "block h-full w-0"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-background/10 px-3 py-2.5 text-background/65">
        <span className="text-[9.5px] font-medium">A Kurukoo moment, shown as a visual demo</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              setSlide((value) => (value - 1 + videoScenes.length) % videoScenes.length)
            }
            aria-label="Previous showcase scene"
            className="grid size-6 place-items-center rounded-full bg-background/10 hover:bg-background/15"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSlide((value) => (value + 1) % videoScenes.length)}
            aria-label="Next showcase scene"
            className="grid size-6 place-items-center rounded-full bg-background/10 hover:bg-background/15"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicActivityFeed({
  signedIn,
  onOpenAuth,
}: {
  signedIn: boolean;
  onOpenAuth?: ((mode: AuthMode) => void) | undefined;
}) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setOffset((value) => (value + 1) % activityItems.length),
      3200,
    );
    return () => window.clearInterval(timer);
  }, []);
  const items = Array.from(
    { length: 4 },
    (_, index) => activityItems[(offset + index) % activityItems.length] ?? activityItems[0],
  );
  return (
    <section className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="size-[15px] text-primary" />
          <h2 className="text-[13px] font-semibold">Activity</h2>
        </div>
        <Link
          to={signedIn ? "/activity" : "/login"}
          onClick={(event) => {
            if (!signedIn) {
              event.preventDefault();
              onOpenAuth?.("login");
            }
          }}
          className="text-[9px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          My Activity
        </Link>
      </div>
      <div className="mt-2.5 space-y-2.5 overflow-hidden">
        {items.map(([type, text, time]) => (
          <div key={`${type}-${text}`} className="flex gap-2 transition-all duration-500">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0">
              <p className="text-[10.5px] leading-snug">
                <span className="font-semibold">{type}</span> · {text}{" "}
                <span className="text-muted-foreground">· {time}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopicsPeek() {
  const [topics, setTopics] = useState<CanonicalTopic[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void fetchCanonicalTopics(4)
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="size-[15px] text-primary" />
            <h2 className="text-[13px] font-semibold">Topics</h2>
          </div>
          <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">
            Questions, experiences and local context from the community.
          </p>
        </div>
        <Link
          to="/topics"
          className="text-[9.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          See all
        </Link>
      </div>
      <Link
        to="/topics/create"
        className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-2 text-[10.5px] font-medium transition-colors hover:bg-elevated"
      >
        <span className="flex items-center gap-1.5">
          <span className="grid size-5 place-items-center rounded-full bg-brand-tint text-brand-ink">
            <Plus className="size-3" />
          </span>
          Start a Topic
        </span>
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </Link>
      <div className="mt-2 space-y-1">
        {loading ? (
          [0, 1].map((item) => (
            <div key={item} className="h-10 animate-pulse rounded-xl bg-elevated/70" />
          ))
        ) : topics.length ? (
          topics.map((topic) => (
            <Link
              key={topic.id}
              to="/topics/$slug"
              params={{ slug: topic.slug }}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-elevated"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-elevated text-muted-foreground">
                <MessageCircle className="size-3" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-medium">{topic.title}</p>
                <p className="truncate text-[9px] text-muted-foreground">
                  {topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}
                  {topic.category ? ` · ${topic.category.replace(/[_-]/g, " ")}` : ""}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border px-2.5 py-3 text-[10px] leading-relaxed text-muted-foreground">
            No public Topics are available yet. Start the first useful conversation.
          </div>
        )}
      </div>
    </section>
  );
}

export function PublicContextRail({
  signedIn,
  onOpenAuth,
}: {
  signedIn: boolean;
  onOpenAuth?: (mode: AuthMode) => void;
}) {
  return (
    <aside
      aria-label="Kurukoo public context rail"
      className="flex h-full min-w-0 flex-col overflow-y-auto bg-background/70 px-3 py-4"
    >
      <SearchBox />
      <section className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="size-[14px] text-primary" />
            <h2 className="text-[13px] font-semibold">Recent videos</h2>
          </div>
          <span className="text-[9px] text-muted-foreground">Watch</span>
        </div>
        <PublicVideoCarousel />
      </section>
      <div className="mt-3">
        <PublicActivityFeed signedIn={signedIn} onOpenAuth={onOpenAuth} />
      </div>
      <div className="mt-3">
        <TopicsPeek />
      </div>
    </aside>
  );
}
