import { Check, Circle, CreditCard, FileCheck2, MapPin, MessageCircle, ShieldCheck, Star, Truck, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { EconomicRequest } from "@/lib/kurukoo-api";
import { approveEconomicRequest, completeEconomicRequest } from "@/lib/canonical-work-api";
import { cn } from "@/lib/utils";

const stages = [["request", "Request"], ["discovery", "Options"], ["quote", "Quote"], ["approval", "Approval"], ["payment", "Payment"], ["fulfilment", "Fulfilment"], ["evidence", "Outcome"]] as const;
type Stage = typeof stages[number][0];
function stageFor(status: string): Stage {
  if (["requested", "awaiting_match", "partially_matched"].includes(status)) return "request";
  if (["matched", "quoting"].includes(status)) return "discovery";
  if (status === "quoted") return "quote";
  if (status === "awaiting_confirmation") return "approval";
  if (["payment_pending", "paid"].includes(status)) return "payment";
  if (["reserved", "in_fulfillment", "fulfilled", "dispatched", "driver_assigned", "arriving", "in_transit"].includes(status)) return "fulfilment";
  return status === "completed" ? "evidence" : "request";
}
function label(value: string) { return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function field(request: EconomicRequest, names: string[]) { for (const name of names) { const value = request.requirements?.[name]; if (value !== undefined && value !== null && String(value).trim()) return String(value); } return ""; }

export function RequestExecution({ request: initialRequest, onAsk }: { request: EconomicRequest; onAsk?: (prompt: string) => void }) {
  const [request, setRequest] = useState(initialRequest);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => { setRequest(initialRequest); }, [initialRequest]);

  const current = stageFor(request.status); const currentIndex = stages.findIndex(([key]) => key === current);
  const from = field(request, ["pickup", "from", "origin", "pickup_location"]); const to = field(request, ["dropoff", "to", "destination", "dropoff_location"]);
  const provider = field(request, ["provider", "provider_name", "seller", "rider", "driver"]); const eta = field(request, ["eta", "estimated_arrival", "arrival"]); const vehicle = field(request, ["vehicle", "vehicle_type", "ride_type"]);
  const quoteText = request.amount != null ? `${request.currency ?? ""} ${request.amount}`.trim() : request.quote ? "Quote available" : "Not returned yet";
  const terminal = ["completed", "cancelled", "abandoned", "disputed", "failed"].includes(request.status);
  const isRide = /ride|transport|taxi|car|motor/i.test(request.skill);
  const feedbackAvailable = request.status === "completed";
  const canApprove = request.status === "awaiting_confirmation";
  const canComplete = ["fulfilled", "in_fulfillment"].includes(request.status);

  async function runCanonicalAction(action: "approve" | "complete") {
    if (actionBusy) return;
    setActionBusy(true); setActionError("");
    try {
      const updated = action === "approve"
        ? await approveEconomicRequest(request.id)
        : await completeEconomicRequest(request.id, { source: "user_confirmed_from_work" });
      if (!updated) throw new Error("Kurukoo did not return the updated request.");
      setRequest(updated);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "That request action could not be completed.");
    } finally { setActionBusy(false); }
  }

  return <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]" aria-label="Request execution">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Request</p><h2 className="mt-1 text-[19px] font-semibold">{label(request.skill)}</h2><p className="mt-1 text-[12px] text-muted-foreground">Follow the live request state and take the next action when Kurukoo needs you.</p></div><span className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium">{label(request.status)}</span></div>
    <ol className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">{stages.map(([key, name], index) => { const done = terminal || index < currentIndex; const active = index === currentIndex && !terminal; return <li key={key} className="min-w-0"><div className="flex items-center gap-1.5"><span className={cn("grid size-7 shrink-0 place-items-center rounded-full border", done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary text-primary" : "border-border text-muted-foreground")}>{done ? <Check className="size-3.5" strokeWidth={3} /> : <Circle className="size-3" />}</span><span className={cn("truncate text-[10px]", active && "font-semibold text-foreground", !active && !done && "text-muted-foreground")}>{name}</span></div></li>; })}</ol>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {from || to ? <div className="rounded-xl bg-elevated/60 p-3"><MapPin className="size-4 text-primary"/><p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Route</p><p className="mt-1 text-[12px]">{from || "Pickup not specified"}</p>{to ? <p className="mt-0.5 text-[12px] text-muted-foreground">→ {to}</p> : null}</div> : null}
      {provider ? <div className="rounded-xl bg-elevated/60 p-3"><UserRound className="size-4 text-primary"/><p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Provider</p><p className="mt-1 text-[12px]">{provider}</p>{vehicle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{vehicle}</p> : null}</div> : null}
      {eta ? <div className="rounded-xl bg-elevated/60 p-3"><Truck className="size-4 text-primary"/><p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">ETA</p><p className="mt-1 text-[12px]">{eta}</p></div> : null}
      <div className="rounded-xl bg-elevated/60 p-3"><CreditCard className="size-4 text-primary"/><p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Commercial</p><p className="mt-1 text-[12px]">{quoteText}</p><p className="mt-0.5 text-[10.5px] text-muted-foreground">{request.status === "awaiting_confirmation" || request.status === "payment_pending" ? "Needs your review" : "Canonical state"}</p></div>
    </div>
    {isRide && (provider || eta || vehicle) ? <div className="mt-3 rounded-xl border border-primary/15 bg-brand-tint/10 p-3"><div className="flex items-center gap-2"><Truck className="size-4 text-primary"/><p className="text-[12px] font-medium">Ride progress</p></div><div className="mt-2 grid gap-2 sm:grid-cols-3"><div><p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">Driver</p><p className="mt-0.5 text-[11.5px]">{provider || "Not assigned"}</p></div><div><p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">Vehicle</p><p className="mt-0.5 text-[11.5px]">{vehicle || "Not returned"}</p></div><div><p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">Arrival</p><p className="mt-0.5 text-[11.5px]">{eta || "Not returned"}</p></div></div></div> : null}
    {!terminal ? <div className="mt-4 rounded-xl border border-border px-3.5 py-3"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/><p className="text-[12px] font-medium">Next step</p></div><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{request.status === "awaiting_confirmation" ? "Review the returned option. Approving will reserve the request through the canonical lifecycle." : request.status === "payment_pending" ? "Review the payment step. Payment is not treated as approved until you explicitly confirm it." : request.status === "in_fulfillment" ? "The provider is carrying out the request. Kurukoo will surface status and evidence as they arrive." : "Kurukoo will move the request forward using connected capability evidence and surface the next decision when one is needed."}</p></div> : null}
    {actionError ? <p className="mt-3 text-[11.5px] text-destructive">{actionError}</p> : null}
    {(canApprove || canComplete) ? <div className="mt-4 flex flex-wrap gap-2">{canApprove ? <button type="button" disabled={actionBusy} onClick={() => void runCanonicalAction("approve")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50">{actionBusy ? "Updating…" : "Approve and reserve"}</button> : null}{canComplete ? <button type="button" disabled={actionBusy} onClick={() => void runCanonicalAction("complete")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50">{actionBusy ? "Updating…" : "Mark complete"}</button> : null}</div> : null}
    {feedbackAvailable ? <div className="mt-4 rounded-xl border border-border bg-elevated/35 p-3"><div className="flex items-center gap-2"><Star className="size-4 text-primary"/><p className="text-[12px] font-medium">How did it go?</p></div><p className="mt-1 text-[11px] text-muted-foreground">Feedback can be attached to the completed request. No rating is submitted until you choose it.</p><div className="mt-2 flex gap-1.5" aria-label="Rating controls">{[1,2,3,4,5].map((n)=><button key={n} type="button" onClick={() => onAsk?.(`I completed request ${request.id}. I want to give it a rating of ${n} out of 5.`)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-surface" aria-label={`${n} out of 5`}><Star className="size-3.5"/></button>)}</div></div> : null}
    <div className="mt-4 flex flex-wrap gap-2">{onAsk ? <button type="button" onClick={() => onAsk(`Review request ${request.id}. Tell me the current status, evidence, provider, quote, payment state and exactly what needs my approval.`)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground">Ask Kurukoo about this request</button> : null}<Link to="/chat" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-elevated"><MessageCircle className="size-3.5"/>Continue conversation</Link>{request.status === "completed" ? <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-elevated px-3 py-1.5 text-[12px] font-medium"><FileCheck2 className="size-3.5"/>Outcome recorded</span> : null}</div>
    {request.status === "completed" ? <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onAsk?.(`The request ${request.id} is complete. Help me reorder or repeat the same ${request.skill} outcome.`)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-elevated">Repeat this request</button><button type="button" onClick={() => onAsk?.(`Remember the useful outcome from completed request ${request.id}, if it is appropriate to save as owner context.`)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-elevated">Keep useful context</button></div> : null}
  </section>;
}
