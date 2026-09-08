import { cn } from "@/lib/utils";
import { AppShell as ContextualAppShell, EmptyState, useProfileName, KurukooLogo } from "./app-shell-contextual";
import type { ReactNode } from "react";

export { ContextualAppShell as AppShell, EmptyState, useProfileName, KurukooLogo };

/** Shared page heading treatment. Marketing surfaces use a meaningful page eyebrow rather than an internal product label. */
export function PageHeader({
  title,
  description,
  subtitle,
  eyebrow,
  action,
}: {
  title?: string;
  description?: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const label = eyebrow ?? title ?? "Kurukoo";
  return (
    <header className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5">
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">{label}</p>
        {title ? (
          <h1 className="mt-2 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[48px]">
            {title}
          </h1>
        ) : null}
        {(description ?? subtitle) ? (
          <p className="mt-3 max-w-2xl text-[13px] leading-5 text-muted-foreground">
            {description ?? subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
