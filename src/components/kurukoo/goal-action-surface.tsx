import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";

export type GoalAction = {
  title: string;
  description: string;
  prompt: string;
  detail?: string;
};

type GoalActionSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions: GoalAction[];
  backLabel?: string;
};

export function GoalActionSurface({
  eyebrow,
  title,
  description,
  actions,
  backLabel = "Explore",
}: GoalActionSurfaceProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {backLabel}
      </Link>

      <header className="max-w-2xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-[32px]">{title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2" aria-label={title}>
        {actions.map((action) => (
          <Link
            key={action.title}
            to="/chat"
            search={{ query: action.prompt } as never}
            className="group flex min-h-[132px] flex-col rounded-[18px] border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-elevated/45"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold leading-snug">{action.title}</h2>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
              {action.description}
            </p>
            {action.detail ? (
              <p className="mt-2 text-[10.5px] font-medium text-foreground/70">{action.detail}</p>
            ) : null}
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11px] font-medium text-primary">
              <MessageCircle className="size-3.5" />
              Start in Chat
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
