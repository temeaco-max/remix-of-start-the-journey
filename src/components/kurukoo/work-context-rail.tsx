import { CheckCircle2, Clock3, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";

type Icon = ComponentType<{ className?: string }>;

interface SectionProps {
  title: string;
  icon: Icon;
  to?: string;
  children: ReactNode;
}

function Section({ title, icon: Icon, to, children }: SectionProps) {
  return (
    <section className="trusted-context-card rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-[12.5px] font-semibold">{title}</h2>
        </div>
        {to && (
          <Link
            to={to as never}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            View <span className="inline-block ml-0.5">→</span>
          </Link>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  detail,
  to,
  live = false,
}: {
  icon: Icon;
  title: string;
  detail: string;
  to?: string;
  live?: boolean;
}) {
  const row = (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full ${
          live ? "bg-brand-tint text-brand-ink" : "bg-elevated text-muted-foreground"
        }`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11.5px] font-medium">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
  return to ? (
    <Link to={to as never} className="block rounded-xl hover:bg-elevated">
      {row}
    </Link>
  ) : (
    row
  );
}

/**
 * WorkContextRail — content that takes over the Trusted Context rail
 * when viewing a specific Work request detail page.
 */
export function WorkContextRail({
  status,
  stage,
  title,
  isTerminal,
  onAskKurukoo,
}: {
  status: string;
  stage: string;
  title: string;
  isTerminal: boolean;
  onAskKurukoo: string;
}) {
  return (
    <>
      <Section title="Request status" icon={Target}>
        <Row
          icon={isTerminal ? CheckCircle2 : Clock3}
          title={title}
          detail={isTerminal ? "Closed" : "In progress"}
          live
        />
        <Row icon={Target} title="Stage" detail={stage.replace(/_/g, " ")} />
        <Row icon={Sparkles} title="Status" detail={status.replace(/[_-]/g, " ")} />
      </Section>

      <Section title="Safety state" icon={ShieldCheck} to="/trust">
        <Row
          icon={ShieldCheck}
          title="Permissions"
          detail="Review before consequential action"
          to="/trust"
        />
      </Section>

      <Section title="Communication" icon={Clock3} to="/messages">
        <Row icon={Clock3} title="Activity" detail="Follow progress in Chat" to="/chat" />
      </Section>
    </>
  );
}
