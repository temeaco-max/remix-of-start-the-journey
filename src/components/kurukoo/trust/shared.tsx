import { AlertTriangle, CheckCircle2, FileText, Shield, Target, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";
import type { AuditEntry, Credential, ExecutionSession, PurchaseProtection, TrustResourceState, VirtualCard } from "@/lib/trust-api";

export const credentialTypeLabel: Record<string, string> = {
  password: "Password",
  api_key: "API key",
  token: "Token",
  note: "Secure note",
  other: "Other",
};
export const kindLabel: Record<string, string> = {
  intent: "Intent",
  request: "Request",
  goal: "Goal",
  action: "Action",
  outcome: "Outcome",
  evidence: "Evidence",
};
export function kindIcon(kind: string) {
  switch (kind) {
    case "intent":
      return <Zap className="size-4 text-primary" />;
    case "request":
      return <Target className="size-4 text-accent" />;
    case "goal":
      return <Shield className="size-4 text-primary" />;
    case "outcome":
      return <CheckCircle2 className="size-4 text-[var(--color-success)]" />;
    default:
      return <FileText className="size-4 text-muted-foreground" />;
  }
}
export function formatMinor(minor: number, currency: string) {
  const symbol =
    currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${symbol}${(minor / 100).toFixed(2)}`;
}
export function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}
export function statusTone(status: string) {
  if (["active", "ready", "completed", "approved", "available", "success"].includes(status))
    return "bg-[var(--color-success)]/15 text-[var(--color-success)]";
  if (
    ["frozen", "claimed", "queued", "running", "busy", "starting", "pending", "used"].includes(
      status,
    )
  )
    return "bg-accent/15 text-accent";
  if (["failed", "error", "denied", "provider_required", "cancelled", "expired"].includes(status))
    return "bg-destructive/15 text-destructive";
  return "bg-elevated text-muted-foreground";
}
export function pretty(value: string) {
  return value.replace(/[_-]/g, " ");
}
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-elevated" />
      ))}
    </div>
  );
}
export function EmptyNote({ children }: { children: string }) {
  return (
    <div className="px-5 py-10 text-center text-[11.5px] text-muted-foreground">{children}</div>
  );
}

/** Honest rendering of a capability the backend refused or could not read. Nothing is simulated. */
export function AvailabilityNote({
  label,
  state,
}: {
  label: string;
  state?: TrustResourceState | undefined;
}) {
  if (!state || state.state === "available") return null;
  if (state.state === "unavailable")
    return (
      <div className="px-5 py-10 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        {label} is not enabled for this account or market yet, so nothing is shown as if it worked.
        {state.message ? ` ${state.message}` : ""}
      </div>
    );
  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-5 py-10 text-[11.5px] leading-relaxed text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{state.message || `${label} could not be read from Kurukoo right now.`}</span>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}
export type TrustSnapshot = {
  credentials: Credential[];
  cards: VirtualCard[];
  sessions: ExecutionSession[];
  claims: PurchaseProtection[];
  audit: AuditEntry[];
  auditTotal: number;
  availability: Record<string, TrustResourceState>;
};

