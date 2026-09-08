import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Clock3, LoaderCircle, MessageCircle, ShieldCheck, ShoppingBag, Users, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Message as MessageModel, WorkItem, WorkStage } from "@/lib/kurukoo-store";

export const stageLabel: Record<WorkStage, string> = {
  understanding: "Getting started",
  working: "In progress",
  needs_you: "Needs you",
  done: "Done",
};

export function Status({ stage }: { stage: WorkStage }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]",
        stage === "needs_you"
          ? "bg-accent text-accent-foreground"
          : "bg-elevated text-muted-foreground",
      )}
    >
      {stage !== "done" ? (
        <span className="size-1.5 rounded-full bg-current opacity-70 motion-safe:animate-pulse" />
      ) : (
        <Check className="size-3" strokeWidth={3} />
      )}
      {stageLabel[stage]}
    </span>
  );
}


function readableLabel(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "";
}

function CardAction({
  label,
  href,
  onClick,
  primary = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const className = cn(
    "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-medium transition-colors",
    primary
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border border-border hover:bg-elevated",
  );
  if (href) return <Link to={href as never} className={className}>{label}<ChevronRight className="size-3.5" /></Link>;
  return <button type="button" onClick={onClick} className={className}>{label}<ChevronRight className="size-3.5" /></button>;
}

function ChatCard({ data, onAction }: { data: Record<string, unknown>; onAction?: (text: string) => void }) {
  const type = String(data["type"] ?? "");
  if (type === "semantic_conversation" || data["hidden"]) return null;

  if (type === "provider_match") {
    return <div className="mt-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2"><Users className="size-4 text-primary" /><p className="text-[12px] font-semibold">Provider options</p></div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">Kurukoo found supported provider context for this request. Review the options before continuing.</p>
      <div className="mt-3 flex flex-wrap gap-2"><CardAction label="Review options" href={typeof data["requestId"] === "string" ? `/work/${data["requestId"]}` : "/work"} primary /><CardAction label="Continue in Chat" href="/chat" /></div>
    </div>;
  }

  if (type === "payment") {
    const stage = readableLabel(data["stage"]) || "Payment";
    return <div className="mt-3 rounded-2xl border border-primary/20 bg-brand-tint/15 p-4">
      <div className="flex items-center gap-2"><ShoppingBag className="size-4 text-primary" /><p className="text-[12px] font-semibold">{stage}</p></div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">A payment step is ready. Kurukoo will not commit it without your approval.</p>
      <div className="mt-3"><CardAction label="Review payment" href="/wallet" primary /></div>
    </div>;
  }

  if (type === "agentic_storefront") {
    return <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2"><ShoppingBag className="size-4 text-primary" /><p className="text-[12px] font-semibold">Shopping result</p></div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">Kurukoo has a product or order context ready for review.</p>
      <div className="mt-3 flex flex-wrap gap-2"><CardAction label="Review result" href="/explore" primary /><CardAction label="Ask Kurukoo" href="/chat" /></div>
    </div>;
  }

  if (type === "emergency") {
    const status = readableLabel(data["status"]) || "Emergency mode";
    const service = data["service"] && typeof data["service"] === "object" ? data["service"] as Record<string, unknown> : null;
    const number = service && typeof service["number"] === "string" ? String(service["number"]) : null;
    return <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-destructive" /><p className="text-[12px] font-semibold">{status}</p></div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Kurukoo will not claim that emergency responders were contacted unless the canonical connection provides evidence.</p>
      {number ? <a href={`tel:${number}`} className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground">Call {number}<ChevronRight className="size-3.5" /></a> : null}
    </div>;
  }

  if (type === "quick_replies" || type === "welcome") {
    const options = Array.isArray(data["options"]) ? data["options"].filter((value): value is string => typeof value === "string").slice(0, 6) : [];
    return <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2"><MessageCircle className="size-4 text-primary" /><p className="text-[12px] font-semibold">{type === "welcome" ? String(data["title"] ?? "What would you like to do?") : "Choose a starting point"}</p></div>
      <div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <CardAction key={option} label={option} onClick={() => onAction?.(option)} />)}</div>
    </div>;
  }

  if (type === "progress" || type === "diagnostics") {
    return <div className="mt-3 rounded-2xl border border-border bg-elevated/35 p-4"><div className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin text-primary" /><p className="text-[12px] font-semibold">{readableLabel(data["label"] ?? data["stage"]) || "Working"}</p></div><p className="mt-1.5 text-[11.5px] text-muted-foreground">Kurukoo is checking supported state. This may take a moment.</p></div>;
  }

  if (type === "referral" || type === "memory_action" || type === "memory") {
    const title = type === "referral" ? "Referral" : "Memory";
    const label = type === "referral" ? "Open referral" : "Review saved context";
    const href = type === "referral" && typeof data["destination"] === "string" ? data["destination"] : "/memory";
    return <div className="mt-3 rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><Zap className="size-4 text-primary" /><p className="text-[12px] font-semibold">{title}</p></div><p className="mt-1.5 text-[11.5px] text-muted-foreground">{type === "memory" ? "Your saved context remains owner-scoped and reviewable." : "Continue through the canonical referral surface."}</p><div className="mt-3"><CardAction label={label} href={href} primary /></div></div>;
  }

  if (typeof data["status"] === "string" || typeof data["stage"] === "string") {
    return <div className="mt-3 rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /><p className="text-[12px] font-semibold">{readableLabel(data["type"]) || "Kurukoo update"}</p><span className="ml-auto text-[10px] text-muted-foreground">{readableLabel(data["status"] ?? data["stage"])}</span></div><p className="mt-1.5 text-[11.5px] text-muted-foreground">This status is linked to the current conversation context.</p></div>;
  }
  return null;
}

export function Message({ message, onAction }: { message: MessageModel; onAction?: (text: string) => void }) {
  const you = message.role === "you";
  return (
    <div className={cn("flex", you ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[88%] text-[15px] leading-relaxed", you ? "rounded-2xl rounded-br-md bg-elevated px-4 py-2.5" : "text-foreground")}>
        {message.text}
        {!you && message.progressStage && !message.text ? <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />{readableLabel(message.progressStage) || "Working"}</div> : null}
        {!you && message.cardData ? <ChatCard data={message.cardData} onAction={onAction} /> : null}
      </div>
    </div>
  );
}


