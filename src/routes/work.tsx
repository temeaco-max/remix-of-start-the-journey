import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { useKurukoo, type WorkStage } from "@/lib/kurukoo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work — Kurukoo" },
      { name: "description", content: "Everything Kurukoo is handling for you, and what it needs from you." },
      { property: "og:title", content: "Work — Kurukoo" },
      { property: "og:description", content: "Track requests Kurukoo is carrying out on your behalf." },
    ],
  }),
  component: WorkPage,
});

const stageLabel: Record<WorkStage, string> = {
  understanding: "Understanding",
  working: "Working",
  needs_you: "Needs you",
  done: "Done",
};

function WorkPage() {
  const { work, advance } = useKurukoo();

  return (
    <>
      <PageHeader title="Work" subtitle="What Kurukoo is taking care of right now." />
      {work.length === 0 ? (
        <EmptyState
          title="Nothing in flight"
          body="Ask Kurukoo for something on Home and it will show up here as it makes progress."
        />
      ) : (
        <ul className="space-y-3">
          {work.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[15.5px] font-medium">{item.title}</p>
                  <p className="mt-1 text-[14px] text-muted-foreground">{item.detail}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[12px]",
                    item.stage === "needs_you"
                      ? "bg-accent text-accent-foreground"
                      : "bg-elevated text-muted-foreground",
                  )}
                >
                  {stageLabel[item.stage]}
                </span>
              </div>
              <ol className="mt-4 space-y-2">
                {item.steps.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 text-[14px]">
                    <span
                      className={cn(
                        "grid size-[18px] place-items-center rounded-full border",
                        s.done ? "border-transparent bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {s.done ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className={cn(s.done ? "text-muted-foreground" : "")}>{s.label}</span>
                  </li>
                ))}
              </ol>
              {item.stage !== "done" ? (
                <button
                  type="button"
                  onClick={() => advance(item.id)}
                  className="mt-4 rounded-lg border border-border px-3 py-1.5 text-[13.5px] transition-colors hover:bg-elevated"
                >
                  {item.stage === "needs_you" ? "Confirm and finish" : "Continue"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
