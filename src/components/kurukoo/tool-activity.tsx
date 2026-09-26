import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolActivityEntry } from "@/lib/kurukoo-api";

/**
 * Live transcript of what the agent is actually doing.
 *
 * A coding or research turn can take many real steps. Showing them is the
 * difference between "Kurukoo said something" and "Kurukoo did something" —
 * each row is an observed tool result, never a fabricated one.
 */
export function ToolActivityTranscript({
  steps,
  defaultOpen = false,
}: {
  steps: ToolActivityEntry[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const endRef = useRef<HTMLDivElement | null>(null);
  const ordered = [...steps].sort((a, b) => a.step - b.step);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [ordered.length, open]);

  if (!ordered.length) return null;
  const failures = ordered.filter((step) => !step.ok).length;

  return (
    <div className="rounded-xl border border-border bg-elevated/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        <span className="font-medium">
          {ordered.length} step{ordered.length === 1 ? "" : "s"} taken
        </span>
        {failures > 0 ? (
          <span className="text-[11px] text-destructive">{failures} could not complete</span>
        ) : null}
      </button>
      {open ? (
        <ol className="space-y-1 px-3 pb-3" aria-label="Agent activity">
          {ordered.map((step) => (
            <li key={step.step} className="flex items-start gap-2 text-[12px]">
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                {step.ok ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <X className="size-3.5 text-destructive" />
                )}
              </span>
              <span className="min-w-0">
                <span className={cn("block", step.ok ? "text-foreground" : "text-destructive")}>
                  {step.label}
                </span>
                {step.detail ? (
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {step.detail}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
          <div ref={endRef} />
        </ol>
      ) : null}
    </div>
  );
}

export function ToolActivityPending({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
