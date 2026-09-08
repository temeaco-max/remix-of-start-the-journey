import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";

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
          <div
            key={action.title}
            className="group flex min-h-[126px] flex-col rounded-[18px] border border-border bg-surface p-4 transition-colors hover:border-primary/25 hover:bg-elevated/45"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold leading-snug">{action.title}</h2>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
              {action.description}
            </p>
            {action.detail ? (
              <p className="mt-2 text-[10.5px] font-medium text-foreground/70">{action.detail}</p>
            ) : null}
            <div className="mt-auto flex items-center gap-2 pt-4">
              <AskKurukoo prompt={action.prompt} className="min-h-8 px-2.5 text-[11px]" />
              <Link
                to="/chat"
                search={{ query: action.prompt } as never}
                aria-label={`Open ${action.title} in Chat`}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
