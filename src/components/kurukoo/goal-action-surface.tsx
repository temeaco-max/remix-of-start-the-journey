import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, MessageCircle } from "lucide-react";

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
  backLabel = "Back to Explore",
}: GoalActionSurfaceProps) {
  return (
    <div className="space-y-7">
      <Link
        to="/explore"
        className="inline-flex items-center text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
      >
        {backLabel}
      </Link>

      <section className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-7">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight md:text-[30px]">{title}</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.title}
            to="/chat"
            search={{ query: action.prompt } as never}
            className="group rounded-[20px] border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-elevated/50"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-tint text-brand-ink">
                <CheckCircle2 className="size-[17px]" />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold">{action.title}</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{action.description}</p>
            {action.detail ? <p className="mt-3 text-[10.5px] font-medium text-foreground/70">{action.detail}</p> : null}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground">
              <MessageCircle className="size-3.5" />
              Start with Kurukoo
            </span>
          </Link>
        ))}
      </section>

      <div className="rounded-[18px] border border-border bg-elevated/35 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
        Kurukoo will interpret the request, find the appropriate route or provider, and ask for confirmation before consequential actions. Availability and pricing are only shown when supported by current evidence.
      </div>
    </div>
  );
}
