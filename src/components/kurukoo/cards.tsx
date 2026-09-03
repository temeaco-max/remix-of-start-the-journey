import { Link } from "@tanstack/react-router";
import { BadgeCheck, MessageSquare, Play, Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, FollowButton, SaveButton, ShareButton } from "@/components/kurukoo/ui";
import type { Agent, Artifact, Entity, Plan, Topic, Transaction, Video } from "@/lib/kurukoo-demo";

export function EntityCard({ entity, footer }: { entity: Entity; footer?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar name={entity.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              to="/profile/$entityId"
              params={{ entityId: entity.id }}
              className="truncate text-[15.5px] font-medium hover:underline"
            >
              {entity.name}
            </Link>
            {entity.verified ? (
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
            ) : null}
          </div>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">{entity.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="capitalize">{entity.kind}</span>
            {entity.location ? <span>· {entity.location}</span> : null}
            {entity.rating ? (
              <span className="inline-flex items-center gap-1">
                · <Star className="size-3" /> {entity.rating}
              </span>
            ) : null}
          </div>
        </div>
        <FollowButton small />
      </div>
      <div className="mt-3 flex items-center gap-1">
        <Link
          to="/"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[13.5px] transition-colors hover:bg-elevated"
        >
          <MessageSquare className="size-4" /> Ask Kurukoo
        </Link>
        <Link
          to="/messages"
          className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-[13.5px] transition-colors hover:bg-elevated"
        >
          Message
        </Link>
        <SaveButton />
        <ShareButton />
      </div>
      {footer}
    </div>
  );
}

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/topics/$slug"
            params={{ slug: topic.slug }}
            className="text-[15.5px] font-medium hover:underline"
          >
            {topic.name}
          </Link>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">{topic.blurb}</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {topic.followers.toLocaleString()} following
          </p>
        </div>
        <FollowButton small />
      </div>
    </div>
  );
}

export function VideoFrame({
  label,
  className,
  large,
}: {
  label: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Video placeholder: ${label}`}
      className={cn(
        "grid aspect-video w-full place-items-center rounded-lg bg-elevated text-muted-foreground",
        className,
      )}
    >
      <Play className={large ? "size-8" : "size-5"} />
    </div>
  );
}

export function VideoCard({ video, creatorName }: { video: Video; creatorName: string }) {
  return (
    <div className="min-w-0">
      <Link to="/videos/$videoId" params={{ videoId: video.id }} className="block">
        <div className="relative">
          <VideoFrame label={video.title} />
          <span className="absolute bottom-2 right-2 rounded bg-background/85 px-1.5 py-0.5 text-[11.5px]">
            {video.duration}
          </span>
        </div>
      </Link>
      <Link
        to="/videos/$videoId"
        params={{ videoId: video.id }}
        className="mt-2 block text-[14.5px] font-medium leading-snug hover:underline"
      >
        {video.title}
      </Link>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {creatorName} · {video.views} views
      </p>
    </div>
  );
}

export function RecommendationCard({
  title,
  reason,
  meta,
  sponsored,
  to,
}: {
  title: string;
  reason: string;
  meta?: string;
  sponsored?: boolean;
  to?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4",
        sponsored ? "border-dashed border-border bg-elevated/60" : "border-border",
      )}
    >
      {sponsored ? (
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Sponsored</p>
      ) : null}
      <p className="text-[15.5px] font-medium">{title}</p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{reason}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-muted-foreground">{meta}</span>
        {to}
      </div>
    </div>
  );
}

export function ContactRow({ entity, right }: { entity: Entity; right?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3.5">
      <Link
        to="/profile/$entityId"
        params={{ entityId: entity.id }}
        className="flex min-w-0 items-center gap-3"
      >
        <Avatar name={entity.name} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-[15px]">{entity.name}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{entity.tagline}</span>
        </span>
      </Link>
      {right}
    </li>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[15.5px] font-medium">
          {agent.name}
          {agent.verified ? <BadgeCheck className="size-4 text-primary" aria-label="Verified" /> : null}
        </p>
        <Badge tone={agent.status === "available" ? "success" : "quiet"}>
          {agent.status === "available"
            ? "Available"
            : agent.status === "busy"
              ? "Working"
              : "Human handoff"}
        </Badge>
      </div>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{agent.purpose}</p>
    </div>
  );
}

export function ArtifactRow({ artifact }: { artifact: Artifact }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-[15px]">{artifact.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {artifact.size} · {artifact.when} · {artifact.storage}
          {artifact.workTitle ? ` · ${artifact.workTitle}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[13px] text-muted-foreground capitalize">{artifact.type}</span>
    </li>
  );
}

export function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-[15px]">{tx.label}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {tx.when} · {tx.kind === "points" ? "Points" : "Money"}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[14px]",
          tx.direction === "in" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {tx.direction === "in" ? "+" : "−"}
        {tx.amount}
      </span>
    </li>
  );
}

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4",
        plan.current ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15.5px] font-medium">{plan.name}</p>
        {plan.current ? <Badge tone="accent">Current plan</Badge> : null}
      </div>
      <p className="mt-1 text-[14px] text-muted-foreground">{plan.price}</p>
      <ul className="mt-3 space-y-1.5 text-[13.5px] text-muted-foreground">
        {plan.benefits.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
    </div>
  );
}
