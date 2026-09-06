import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Ambulance, ArrowRight, Car, Flame, ShieldCheck, Waves } from "lucide-react";

export const Route = createFileRoute("/safety")({
  head: () => ({ meta: [{ title: "Safety — Kurukoo" }, { name: "description", content: "Safety and emergency help with clear confirmation boundaries." }] }),
  component: SafetyPage,
});

const actions = [
  ["Emergency Call", "Start an urgent request and keep the action boundary visible.", AlertTriangle],
  ["Find an Ambulance", "Find emergency medical help and see what has actually been contacted.", Ambulance],
  ["Call Fire Service", "Find the correct fire-service path before anything is claimed as completed.", Flame],
  ["Roadside Emergency", "Get towing or roadside help while keeping the request status visible.", Car],
  ["Get Security Help", "Find appropriate security support and confirm external contact before relying on it.", ShieldCheck],
  ["Flood Alert", "Surface flood guidance and relevant local information.", Waves],
] as const;

function SafetyPage() {
  return <div className="w-full pb-12"><header className="mb-8 border-b border-border/70 pb-5"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Safety & urgent help</p><h1 className="mt-1 text-[34px] font-semibold tracking-[-0.035em]">Get help without losing visibility.</h1><p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">Safety actions are treated differently from ordinary discovery. Kurukoo shows what it can find, what needs your confirmation and what has actually happened.</p></header><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{actions.map(([title,body,Icon])=><Link key={title} to="/chat" className="rounded-2xl border border-border bg-surface p-5 hover:bg-elevated"><span className="grid size-10 place-items-center rounded-full bg-[#fae8e6] text-[#b44d43]"><Icon className="size-5" /></span><h2 className="mt-4 text-[15px] font-semibold">{title}</h2><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{body}</p><span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium">Start with Kurukoo <ArrowRight className="size-3.5" /></span></Link>)}</div><div className="mt-8 rounded-2xl border border-[#ead5c4] bg-[#fff8f1] p-5 text-[#704b39] dark:border-border dark:bg-elevated dark:text-foreground"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0"/><div><p className="text-[13px] font-semibold">Clear action boundary</p><p className="mt-1.5 text-[11.5px] leading-relaxed opacity-80">Kurukoo does not treat a suggested contact as a completed emergency action. External actions must be confirmed by the connected service before the interface says they happened.</p></div></div></div></div>;
}
