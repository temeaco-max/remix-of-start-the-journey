import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { WorkItemCard, Action } from "@/components/kurukoo/primitives";
import { RequestExecution } from "@/components/kurukoo/request-execution";
import { Rows, SectionHeader } from "@/components/kurukoo/ui";
import { artifacts, entities } from "@/lib/kurukoo-demo";
import { ArtifactRow, ContactRow } from "@/components/kurukoo/cards";
import { useEffect, useMemo, useState } from "react";
import { fetchEconomicRequest, isKurukooApiConfigured, type EconomicRequest } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/work/$workId")({
  head: () => ({ meta: [{ title: "Request — Kurukoo" }, { name: "description", content: "Track a Kurukoo request from start to outcome." }] }),
  component: WorkDetail,
});

function previewRequest(item: { id: string; title: string; stage: string; detail: string }): EconomicRequest {
  const status = item.stage === "done" ? "completed" : item.stage === "needs_you" ? "awaiting_confirmation" : item.stage === "working" ? "in_fulfillment" : "awaiting_match";
  const title = item.title.toLowerCase();
  const ride = /ride|taxi|transport|driver/.test(title);
  const requirements: Record<string, unknown> = ride ? { pickup: "Your pickup point", dropoff: "Your destination", vehicle_type: "Car", provider: status === "awaiting_match" ? undefined : "Ayo's Ride Service", eta: status === "awaiting_match" ? undefined : "6 min" } : { request: item.title };
  return { id: item.id, skill: ride ? "ride" : "service", requirements, status, quote: status === "awaiting_confirmation" ? { label: "Indicative quote" } : null, amount: status === "awaiting_confirmation" ? 14 : null, currency: status === "awaiting_confirmation" ? "GBP" : null };
}

function WorkDetail() {
  const { workId } = Route.useParams();
  const { work, advance, send } = useKurukoo();
  const item = work.find((w) => w.id === workId);
  const [request, setRequest] = useState<EconomicRequest | null>(null);
  const [requestError, setRequestError] = useState("");
  const configured = isKurukooApiConfigured();

  useEffect(() => {
    if (!configured) return;
    void fetchEconomicRequest(workId).then(setRequest).catch((error) => setRequestError(error instanceof Error ? error.message : "Unable to load request."));
  }, [configured, workId]);

  const displayRequest = useMemo(() => request ?? (!configured && item ? previewRequest(item) : null), [configured, item, request]);
  if (!item) return <><PageHeader title="Request" /><EmptyState title="Request not found" body="This request is no longer in your current Work list." /><div className="mt-4"><Link to="/work" className="text-[14px] underline">Back to Work</Link></div></>;
  const requirementEntries = request ? Object.entries(request.requirements ?? {}).filter(([, value]) => value !== null && value !== undefined && String(value).trim()) : [];

  return <div className="space-y-6">
    <PageHeader title={item.title} subtitle={item.detail} />
    <WorkItemCard item={item} onAdvance={advance} />
    {displayRequest ? <RequestExecution request={displayRequest} onAsk={send} /> : null}

    {!configured ? <div className="rounded-xl border border-dashed border-border bg-elevated/35 px-3.5 py-2.5 text-[10.5px] text-muted-foreground">Preview lifecycle · the controls demonstrate the live request experience. Connected Kurukoo data replaces this state automatically when the API is configured.</div> : null}

    {request ? <>
      <section><SectionHeader title="Request details" /><Rows><li className="px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium">{request.status.replace(/[_-]/g, " ")}</span><span className="text-[11px] text-muted-foreground">{request.skill.replace(/[_-]/g, " ")}</span></div>{requirementEntries.length ? <dl className="mt-4 grid gap-3 sm:grid-cols-2">{requirementEntries.map(([key, value]) => <div key={key} className="rounded-xl bg-elevated/60 px-3 py-2.5"><dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{key.replace(/[_-]/g, " ")}</dt><dd className="mt-1 text-[13px] leading-5">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl> : <p className="mt-3 text-[12.5px] text-muted-foreground">No additional request details were returned.</p>}</li></Rows></section>
      <section><SectionHeader title="Commercial state" /><Rows><li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="text-[13.5px] font-medium">Quote</p><p className="mt-0.5 text-[12px] text-muted-foreground">{request.quote ? "Quote information is available." : "No quote has been returned yet."}</p></div><span className="text-[13px] font-medium">{request.amount != null ? `${request.currency ?? ""} ${request.amount}`.trim() : "Not available"}</span></li></Rows></section>
    </> : requestError ? <p className="text-[11px] text-destructive">{requestError}</p> : null}

    {!configured ? <>
      <section><SectionHeader title="People" /><Rows>{entities.slice(0, 2).map((e) => <ContactRow key={e.id} entity={e} right={<Link to="/messages" className="text-[13px] text-muted-foreground hover:underline">Message</Link>} />)}</Rows></section>
      <section><SectionHeader title="Files" /><Rows>{artifacts.map((a) => <ArtifactRow key={a.id} artifact={a} />)}</Rows></section>
    </> : null}

    <div className="flex flex-wrap gap-2"><Link to="/chat"><Action variant="primary">Continue conversation</Action></Link><Link to="/work"><Action>Back to Work</Action></Link></div>
  </div>;
}
