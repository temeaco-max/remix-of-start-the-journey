import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { WorkItemCard, Action } from "@/components/kurukoo/primitives";
import { RequestExecution } from "@/components/kurukoo/request-execution";
import { Rows, SectionHeader } from "@/components/kurukoo/ui";
import { artifacts, entities } from "@/lib/kurukoo-demo";
import { ArtifactRow, ContactRow } from "@/components/kurukoo/cards";
import { useEffect, useState } from "react";
import { fetchEconomicRequest, isKurukooApiConfigured, type EconomicRequest } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/work/$workId")({
  head: () => ({ meta: [
    { title: "Request — Kurukoo" },
    { name: "description", content: "The full trail of one request: steps, people, files and outcome." },
    { property: "og:title", content: "Request — Kurukoo" },
    { property: "og:description", content: "Steps, people and results for a single request." },
  ]}),
  component: WorkDetail,
});

function WorkDetail() {
  const { workId } = Route.useParams();
  const { work, advance, send } = useKurukoo();
  const item = work.find((w) => w.id === workId);
  const [request, setRequest] = useState<EconomicRequest | null>(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    void fetchEconomicRequest(workId).then(setRequest).catch((error) => setRequestError(error instanceof Error ? error.message : ""));
  }, [workId]);

  if (!item) return <><PageHeader title="Request" /><EmptyState title="This request isn't in your session" description="This request is no longer in view. Start a new request from Home." /><div className="mt-4"><Link to="/work" className="text-[14px] underline">Back to Work</Link></div></>;

  const canonical = Boolean(request) || isKurukooApiConfigured();
  const requirementEntries = request ? Object.entries(request.requirements ?? {}).filter(([, value]) => value !== null && value !== undefined && String(value).trim()) : [];

  return <>
    <PageHeader title={item.title} subtitle={item.detail} />
    <WorkItemCard item={item} onAdvance={advance} />
    {request ? <RequestExecution request={request} onAsk={send} /> : null}

    {canonical ? <>
      <section className="mt-8"><SectionHeader title="Request details" subtitle="The information Kurukoo is carrying for this request." />{request ? <Rows><li className="px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium">{request.status.replace(/[_-]/g, " ")}</span><span className="text-[11px] text-muted-foreground">{request.skill.replace(/[_-]/g, " ")}</span></div>{requirementEntries.length ? <dl className="mt-4 grid gap-3 sm:grid-cols-2">{requirementEntries.map(([key, value]) => <div key={key} className="rounded-xl bg-elevated/60 px-3 py-2.5"><dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{key.replace(/[_-]/g, " ")}</dt><dd className="mt-1 text-[13px] leading-5">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl> : <p className="mt-3 text-[12.5px] text-muted-foreground">No additional request details were returned.</p>}</li></Rows> : <EmptyState title="Loading the canonical request" body="Kurukoo is checking the live request record before showing its details." />}</section>
      {request ? <section className="mt-8"><SectionHeader title="Commercial state" subtitle="Only values returned by the canonical request are shown." /><Rows><li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="text-[13.5px] font-medium">Quote</p><p className="mt-0.5 text-[12px] text-muted-foreground">{request.quote ? "Quote information is available." : "No quote has been returned yet."}</p></div><span className="text-[13px] font-medium">{request.amount != null ? `${request.currency ?? ""} ${request.amount}`.trim() : "Not available"}</span></li></Rows></section> : null}
    </> : <>
      <section className="mt-8"><SectionHeader title="People involved" subtitle="People connected to this request." /><Rows>{entities.slice(0, 2).map((e) => <ContactRow key={e.id} entity={e} right={<Link to="/messages" className="text-[13px] text-muted-foreground hover:underline">Message</Link>} />)}</Rows></section>
      <section className="mt-8"><SectionHeader title="Files" subtitle="Files attached to this request." /><Rows>{artifacts.map((a) => <ArtifactRow key={a.id} artifact={a} />)}</Rows></section>
    </>}

    <div className="mt-6 flex gap-2"><Link to="/chat"><Action variant="primary">Resume conversation</Action></Link>{!canonical ? <Link to="/artifacts"><Action>Open files</Action></Link> : null}</div>
    {request ? <section className="mt-8"><SectionHeader title="Canonical request" subtitle="Live Economic Request state from Kurukoo." /><div className="rounded-2xl border border-border bg-surface p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium">{request.status.replace(/[_-]/g, " ")}</span><span className="text-[10.5px] text-muted-foreground">{request.skill.replace(/[_-]/g, " ")}</span></div><button type="button" onClick={() => send("Review the current state of this request and tell me what needs my approval.")} className="mt-3 rounded-lg bg-primary px-3 py-2 text-[11.5px] font-medium text-primary-foreground">Ask Kurukoo about this request</button></div></section> : requestError ? <p className="mt-5 text-[11px] text-muted-foreground">{requestError}</p> : null}
    <p className="mt-5 text-[11px] text-muted-foreground">Provider, quote, payment and fulfilment evidence is only shown when the canonical service returns it.</p>
  </>;
}
