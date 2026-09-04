import { Link } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Message as MessageModel, WorkItem, WorkStage } from "@/lib/kurukoo-store";

export const stageLabel: Record<WorkStage, string> = {
  understanding: "Understanding",
  working: "Working",
  needs_you: "Needs you",
  done: "Done",
};

export function Status({ stage }: { stage: WorkStage }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]", stage === "needs_you" ? "bg-accent text-accent-foreground" : "bg-elevated text-muted-foreground")}>
      {stage !== "done" ? <span className="size-1.5 rounded-full bg-current opacity-70 motion-safe:animate-pulse" /> : <Check className="size-3" strokeWidth={3} />}
      {stageLabel[stage]}
    </span>
  );
}

export function Message({ message }: { message: MessageModel }) {
  const you = message.role === "you";
  return <div className={cn("flex", you ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] text-[15px] leading-relaxed", you ? "rounded-2xl rounded-br-md bg-elevated px-4 py-2.5" : "text-foreground")}>{message.text}</div></div>;
}

export function Action({ children, onClick, variant = "quiet", type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "quiet" | "primary"; type?: "button" | "submit" }) {
  return <button type={type} onClick={onClick} className={cn("min-h-9 rounded-lg px-3 py-1.5 text-[13.5px] transition-colors", variant === "primary" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:bg-elevated")}>{children}</button>;
}

export function Progress({ steps }: { steps: WorkItem["steps"] }) {
  return <ol className="mt-4 space-y-2">{steps.map((s) => <li key={s.label} className="flex items-center gap-2.5 text-[14px]"><span className={cn("grid size-[18px] shrink-0 place-items-center rounded-full border", s.done ? "border-transparent bg-primary text-primary-foreground" : "border-border")}>{s.done ? <Check className="size-3" strokeWidth={3} /> : null}</span><span className={cn(s.done && "text-muted-foreground")}>{s.label}</span></li>)}</ol>;
}

export function WorkItemCard({ item, onAdvance }: { item: WorkItem; onAdvance?: (id: string) => void }) {
  return <div className="rounded-xl border border-border bg-surface p-4">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-[15.5px] font-medium">{item.title}</p><p className="mt-1 text-[14px] text-muted-foreground">{item.detail}</p></div><Status stage={item.stage} /></div>
    <Progress steps={item.steps} />
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {item.stage !== "done" && onAdvance ? <Action variant={item.stage === "needs_you" ? "primary" : "quiet"} onClick={() => onAdvance(item.id)}>{item.stage === "needs_you" ? "Confirm and finish" : "Continue"}</Action> : null}
      <Link to="/chat" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"><MessageCircle className="size-3.5" />Continue in Chat</Link>
    </div>
  </div>;
}

export function Result({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-border bg-surface p-4"><p className="text-[15.5px] font-medium">{title}</p><p className="mt-1 text-[14px] text-muted-foreground">{body}</p></div>; }
export function IntegrationGap({ children }: { children: ReactNode }) { return <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Not connected yet · </span>{children}</p>; }
