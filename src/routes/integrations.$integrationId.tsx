import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { getIntegration, integrations, type Integration } from "@/lib/integration-catalog";

export const Route = createFileRoute("/integrations/$integrationId")({
  head: () => ({ meta: [{ title: "Integration — Kurukoo" }] }),
  component: IntegrationDetailPage,
});

function statusLabel(status: Integration["status"]) {
  return status === "native" ? "Built in" : status === "planned" ? "Coming soon" : "Available";
}

function IntegrationDetailPage() {
  const { integrationId } = Route.useParams();
  const integration = getIntegration(integrationId);
  useEffect(() => {
    if (integration) document.title = `${integration.name} — Kurukoo`;
  }, [integration]);
  if (!integration)
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Link to="/integrations" className="text-[11px] font-medium">
          Back to Integrations
        </Link>
        <h1 className="mt-5 font-serif text-3xl">Integration not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This integration is not in the current Kurukoo catalogue.
        </p>
      </div>
    );
  const Icon = integration.icon;
  const label = statusLabel(integration.status);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-10">
      <Link
        to="/integrations"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All integrations
      </Link>
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-tint text-brand-ink">
            <Icon className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-[34px] leading-none tracking-[-0.04em]">
                {integration.name}
              </h1>
              <span className="bg-elevated px-2 py-1 text-[9px] font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              {integration.category} · {integration.auth.toUpperCase()}
            </p>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted-foreground">
              {integration.detail}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {integration.endpoint ? (
            <Link to="/connect" className={actionClass("primary")}>
              {integration.connectionLabel}
            </Link>
          ) : integration.setupPath ? (
            <Link to={integration.setupPath} className={actionClass("primary")}>
              {integration.setupLabel || integration.connectionLabel}
            </Link>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {integration.connectionLabel}
            </span>
          )}
          {integration.setupPath ? (
            <Link to={integration.setupPath} className={actionClass()}>
              <ExternalLink className="mr-1.5 size-3.5" />
              Setup
            </Link>
          ) : null}
        </div>
      </header>
      <section className="grid gap-3 md:grid-cols-2">
        <Panel className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
            Capabilities
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {integration.capabilities.map((capability) => (
              <span
                key={capability}
                className="bg-elevated/70 px-2 py-1 text-[9px] text-muted-foreground"
              >
                {capability}
              </span>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-[13px] font-semibold">Scoped and reversible</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                A connection is a defined doorway, not unlimited access. Important external actions
                still follow the relevant approval and evidence flow, and you can disconnect
                supported services from Connect at any time.
              </p>
            </div>
          </div>
        </Panel>
      </section>
      <section className="border border-border bg-surface p-5 md:p-6">
        <p className="text-[13px] font-semibold">Current catalogue</p>
        <p className="mt-1.5 max-w-3xl text-[11.5px] leading-relaxed text-muted-foreground">
          {integration.description} If the shown status or connection flow does not match a live
          provider, Kurukoo keeps the directory honest and will only mark the integration as
          connected after its actual authorisation or setup flow confirms it.
        </p>
      </section>
      <Link
        to="/integrations"
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Browse all {integrations.length} integrations <ArrowLeft className="rotate-180 size-3.5" />
      </Link>
    </div>
  );
}