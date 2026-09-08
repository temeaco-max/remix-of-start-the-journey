import { Link, useRouterState } from "@tanstack/react-router";
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
import { useEffect, useMemo, useState } from "react";
import type { AuthMode } from "@/components/kurukoo/auth";
import { fetchCanonicalTopics, type CanonicalTopic } from "@/lib/kurukoo-api";
import { getStoredKurukooRole, type KurukooRoleId } from "@/lib/kurukoo-personas";

const guideScenes = {
  general: [
    [
      "I need someone to fix my phone.",
      "Say what you need in plain language and start from there.",
      "Start with the need",
    ],
    [
      "Repair · location · options",
      "Kurukoo brings relevant options and context into view when available.",
      "See useful options",
    ],
    [
      "Example option · details when known",
      "Review what is known, then decide what you want to do.",
      "You decide",
    ],
    [
      "Request confirmed with your approval.",
      "The request stays connected to the work and follow-up.",
      "Keep it moving",
    ],
  ],
  provider: [
    [
      "I can repair iPhones this week.",
      "Tell Kurukoo what you genuinely provide and where you can help.",
      "Describe your service",
    ],
    [
      "Phone repair · location · availability",
      "Your eligible capability can become discoverable when you are ready.",
      "Be discoverable",
    ],
    [
      "A request needs your attention.",
      "Review the work, coordinate with the customer and keep the request moving.",
      "Manage work",
    ],
    [
      "Go Live is on.",
      "Nearby discovery reflects your current availability rather than a permanent promise.",
      "Stay current",
    ],
  ],
  contributor: [
    [
      "I know a useful local place.",
      "Share practical knowledge that helps the network become more useful.",
      "Share knowledge",
    ],
    [
      "A local Topic is gaining replies.",
      "Community context can help people understand what is happening around them.",
      "Add context",
    ],
    [
      "A contribution task is ready.",
      "Keep contribution work connected to the same Kurukoo relationship.",
      "Take part",
    ],
    [
      "Useful information added.",
      "The contribution can remain connected to the relevant task or conversation.",
      "Keep contributing",
    ],
  ],
  partner: [
    [
      "Connect our service to Kurukoo.",
      "Start with the capability or service you want to bring into the network.",
      "Start a connection",
    ],
    [
      "Capability · authorised connection",
      "Explore the supported connection path and its boundaries.",
      "See the path",
    ],
    [
      "A network demand signal appears.",
      "Understand where the service can add useful value before acting.",
      "Find demand",
    ],
    [
      "The partnership is moving.",
      "Keep coordination, work and authorised integrations connected.",
      "Keep it moving",
    ],
  ],
  advertiser: [
    [
      "Reach people who are ready for this.",
      "Start from relevant demand rather than a generic audience.",
      "Find relevance",
    ],
    [
      "Local demand · useful moment",
      "Explore the contexts where people are already looking or deciding.",
      "See the context",
    ],
    [
      "Sponsored discovery",
      "Commercial placements stay clearly labelled and separate from organic results.",
      "Stay transparent",
    ],
    [
      "A relevant offer is shown.",
      "Measure the useful outcome without turning the experience into an uncontrolled feed.",
      "Create value",
    ],
  ],
} as const;

const roleGuide: Record<KurukooRoleId, keyof typeof guideScenes> = {
  seeker: "general",
  provider: "provider",
  business: "general",
  creator: "general",
  contributor: "contributor",
  partner: "partner",
  advertiser: "advertiser",
  "local-agent": "general",
};

function SearchBox() {
  return (
    <form action="/explore" method="get" className="rounded-xl border border-border bg-surface p-2.5 shadow-[var(--shadow-soft)]">
      <label htmlFor="public-context-search" className="sr-only">Search Kurukoo</label>
      <div className="flex items-center gap-2">
        <Search className="size-4 shrink-0 text-primary" />
        <input id="public-context-search" name="query" placeholder="Search Kurukoo" className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground" />
        <button type="submit" className="grid size-7 shrink-0 place-items-center rounded-lg bg-elevated text-muted-foreground hover:text-foreground" aria-label="Search">
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </form>
  );
}

function PublicGuideCarousel({
  scenes,
  resourceSlug,
  roleLabel,
}: {
  scenes: readonly (readonly [string, string, string])[];
  resourceSlug: string;
  roleLabel?: string;
}) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => setSlide(0), [scenes]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % scenes.length), 4200);
    return () => window.clearInterval(timer);
  }, [playing, scenes]);
  const scene = scenes[slide] ?? scenes[0]!;
  return (
    <div className="overflow-hidden rounded-[22px] border border-border bg-foreground text-background shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[9/13] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,color-mix(in_oklch,var(--brand-tint)_70%,transparent),transparent_30%),radial-gradient(circle_at_24%_78%,color-mix(in_oklch,var(--brand-ink)_24%,transparent),transparent_32%),linear-gradient(145deg,var(--foreground),color-mix(in_oklch,var(--foreground)_78%,var(--primary)))]" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="rounded-full bg-background/15 px-2 py-1 text-[9px] font-semibold tracking-wide text-background/80 backdrop-blur">KURUKOO · VISUAL GUIDE</span>
          <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause guide" : "Play guide"} className="grid size-7 place-items-center rounded-full bg-background/15 backdrop-blur">
            {playing ? <Pause className="size-3" /> : <Play className="ml-0.5 size-3" />}
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground via-foreground/35 to-transparent px-3 pb-3 pt-24">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-background/55">{roleLabel ?? "Kurukoo"}</p>
          <p className="mt-1.5 text-[16px] font-semibold leading-tight text-background">{scene[0]}</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-background/75">{scene[1]}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9.5px] font-semibold text-background">{scene[2]}</span>
            <div className="flex gap-1">
              {scenes.map((item, dot) => (
                <button type="button" key={item[0]} onClick={() => setSlide(dot)} aria-label={`Show guide step ${dot + 1}`} className="h-1.5 w-6 overflow-hidden rounded-full bg-background/20">
                  <span className={dot === slide ? "block h-full w-full rounded-full bg-primary" : "block h-full w-0"} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-background/10 px-3 py-2.5 text-background/65">
        <Link to="/resources/$slug" params={{ slug: resourceSlug }} className="min-w-0 truncate text-[9.5px] font-medium hover:text-background">Read the guide</Link>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setSlide((value) => (value - 1 + scenes.length) % scenes.length)} aria-label="Previous guide step" className="grid size-6 place-items-center rounded-full bg-background/10 hover:bg-background/15"><ChevronLeft className="size-3.5" /></button>
          <button type="button" onClick={() => setSlide((value) => (value + 1) % scenes.length)} aria-label="Next guide step" className="grid size-6 place-items-center rounded-full bg-background/10 hover:bg-background/15"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

function PublicActivityFeed({ signedIn, onOpenAuth }: { signedIn: boolean; onOpenAuth?: ((mode: AuthMode) => void) | undefined }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setOffset((value) => (value + 1) % activityItems.length), 3200);
    return () => window.clearInterval(timer);
  }, []);
  const items = Array.from({ length: 4 }, (_, index) => activityItems[(offset + index) % activityItems.length] ?? activityItems[0]);
  return (
    <section className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Zap className="size-[15px] text-primary" /><h2 className="text-[13px] font-semibold">Example activity</h2></div>
        <Link to={signedIn ? "/activity" : "/login"} onClick={(event) => { if (!signedIn) { event.preventDefault(); onOpenAuth?.("login"); } }} className="text-[9px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">My Activity</Link>
      </div>
      <p className="mt-1 text-[9.5px] text-muted-foreground">A preview of the kinds of updates Kurukoo can surface.</p>
      <div className="mt-2.5 space-y-2.5 overflow-hidden">
        {items.map(([type, text, time]) => (
          <div key={`${type}-${text}`} className="flex gap-2 transition-all duration-500">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0"><p className="text-[10.5px] leading-snug"><span className="font-semibold">{type}</span> · {text} <span className="text-muted-foreground">· {time}</span></p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

const activityItems = [
  ["Request", "A verified local provider is found", "example"],
  ["Explore", "A useful place is surfaced nearby", "example"],
  ["Opportunity", "A collaboration is surfaced proactively", "example"],
  ["Work", "A task moves into coordination", "example"],
  ["Topic", "A new discussion starts nearby", "example"],
  ["Creator", "A useful local guide is published", "example"],
] as const;

function TopicsPeek() {
  const [topics, setTopics] = useState<CanonicalTopic[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void fetchCanonicalTopics(4).then(setTopics).catch(() => setTopics([])).finally(() => setLoading(false));
  }, []);
  return (
    <section className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><MessageCircle className="size-[15px] text-primary" /><h2 className="text-[13px] font-semibold">Topics</h2></div><p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">Questions, experiences and local context from the community.</p></div>
        <Link to="/topics" className="text-[9.5px] font-medium text-muted-foreground hover:text-foreground">See all</Link>
      </div>
      <Link to="/topics/create" className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background px-2.5 py-2 text-[10.5px] font-medium transition-colors hover:bg-elevated">
        <span className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded-full bg-brand-tint text-brand-ink"><Plus className="size-3" /></span>Start a Topic</span>
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </Link>
      <div className="mt-2 space-y-1">
        {loading ? [0, 1].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-elevated/70" />) : topics.length ? topics.map((topic) => (
          <Link key={topic.id} to="/topics/$slug" params={{ slug: topic.slug }} className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-elevated">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-elevated text-muted-foreground"><MessageCircle className="size-3" /></span>
            <div className="min-w-0"><p className="truncate text-[10.5px] font-medium">{topic.title}</p><p className="truncate text-[9px] text-muted-foreground">{topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}{topic.category ? ` · ${topic.category.replace(/[_-]/g, " ")}` : ""}</p></div>
          </Link>
        )) : <div className="rounded-xl border border-dashed border-border px-2.5 py-3 text-[10px] leading-relaxed text-muted-foreground">No public Topics are available yet. Start the first useful conversation.</div>}
      </div>
    </section>
  );
}

export function PublicContextRail({ signedIn, onOpenAuth }: { signedIn: boolean; onOpenAuth?: (mode: AuthMode) => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [role, setRole] = useState(getStoredKurukooRole());
  useEffect(() => {
    const read = () => setRole(getStoredKurukooRole());
    window.addEventListener("kurukoo-role-changed", read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener("kurukoo-role-changed", read); window.removeEventListener("storage", read); };
  }, []);
  const guide = useMemo(() => {
    if (pathname.startsWith("/providers")) return { key: "provider" as const, resourceSlug: "provider-and-capability-guides" };
    if (pathname.startsWith("/contributors")) return { key: "contributor" as const, resourceSlug: "contributors-and-tasks" };
    if (pathname.startsWith("/partners")) return { key: "partner" as const, resourceSlug: "channels-and-connected-doors" };
    if (pathname.startsWith("/advertising")) return { key: "advertiser" as const, resourceSlug: "how-kurukoo-works" };
    if (pathname.startsWith("/topics")) return { key: "general" as const, resourceSlug: "how-kurukoo-works" };
    if (pathname.startsWith("/discover")) return { key: "general" as const, resourceSlug: "how-kurukoo-works" };
    if (pathname.startsWith("/explore")) return { key: "general" as const, resourceSlug: "how-kurukoo-works" };
    return { key: roleGuide[role.id], resourceSlug: role.id === "provider" ? "provider-and-capability-guides" : "how-kurukoo-works" };
  }, [pathname, role.id]);
  return (
    <aside aria-label="Kurukoo public context rail" className="flex h-full min-w-0 flex-col overflow-y-auto bg-background/70 px-3 py-4">
      <SearchBox />
      <section className="mt-3">
        <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Play className="size-[14px] text-primary" /><h2 className="text-[13px] font-semibold">How to</h2></div><span className="text-[9px] text-muted-foreground">Visual guide</span></div>
        <PublicGuideCarousel scenes={guideScenes[guide.key]} resourceSlug={guide.resourceSlug} roleLabel={role.title} />
      </section>
      <div className="mt-3"><PublicActivityFeed signedIn={signedIn} onOpenAuth={onOpenAuth} /></div>
      <div className="mt-3"><TopicsPeek /></div>
    </aside>
  );
}
