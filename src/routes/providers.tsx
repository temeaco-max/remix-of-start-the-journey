import { createFileRoute, Link } from "@tanstack/react-router";
import { CarFront, MapPin, RefreshCw, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntityCard } from "@/components/kurukoo/cards";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { Badge, Panel, Rows, SectionHeader, StatTile, Tabs } from "@/components/kurukoo/ui";
import { PulseControl } from "@/components/kurukoo/pulse-control";
import {
  fetchDiscoveryEntities,
  fetchPublicPulseProviders,
  type DiscoveryEntity,
  type PulseProvider,
} from "@/lib/kurukoo-api";
import { entities } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Providers — Kurukoo" },
      {
        name: "description",
        content:
          "Find trusted providers or build a provider profile to offer your capability through Kurukoo.",
      },
    ],
  }),
  component: ProvidersPage,
});
const tabs = ["Find help", "Offer your capability"] as const;
function LiveProviderCard({ provider }: { provider: PulseProvider }) {
  return (
    <article className="rounded-[18px] border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink">
          {provider.source === "mobile" ? <CarFront className="size-4.5" /> : <UsersRound className="size-4.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold">{provider.name}</p>
            <Badge tone="success">Live now</Badge>
            <Badge>Verified</Badge>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {provider.skill}{provider.location ? ` · ${provider.location}` : ""}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <MapPin className="size-3" /> Approximate location · {provider.location_radius_m}m visibility radius
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-elevated/60 px-3 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
        Live Pulse is a current availability signal, not a guaranteed quote or completed commitment.
      </div>
    </article>
  );
}
function DiscoveryProviderCard({ entity }: { entity: DiscoveryEntity }) {
  return (
    <article className="rounded-[18px] border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground"><UsersRound className="size-4.5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold">{entity.name}</p>
            {entity.liveNow ? <Badge tone="success">Live now</Badge> : entity.available === true ? <Badge tone="success">Available</Badge> : <Badge>Not confirmed</Badge>}
            {entity.evidence ? <Badge>{entity.evidence.replace(/[_-]/g, " ")}</Badge> : null}
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">{entity.category ?? entity.kind}{entity.location ? ` · ${entity.location}` : ""}</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
            {entity.description ?? "Discovery information from a connected Kurukoo source."}
          </p>
        </div>
      </div>
      <Link
        to="/chat"
        onClick={() => localStorage.setItem("kurukoo-chat-draft", `Tell me about ${entity.name} and, if appropriate, help me make a verified request.`)}
        className="mt-3 inline-flex min-h-8 items-center rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground"
      >
        Ask Kurukoo about this
      </Link>
    </article>
  );
}
export function ProvidersPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [liveProviders, setLiveProviders] = useState<PulseProvider[]>([]);
  const [discoveredProviders, setDiscoveredProviders] = useState<DiscoveryEntity[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const providers = entities.filter((e) => e.kind === "provider");
  const refreshLive = async () => {
    setLoadingLive(true);
    setLiveError(false);
    try {
      const [pulse, discovered] = await Promise.all([
        fetchPublicPulseProviders(),
        fetchDiscoveryEntities({ layers: ["mobile", "stationary"] }),
      ]);
      setLiveProviders(pulse);
      setDiscoveredProviders(discovered.filter((entity) => entity.kind.toLowerCase().includes("provider") || entity.kind.toLowerCase().includes("business")));
    } catch {
      setLiveError(true);
    } finally {
      setLoadingLive(false);
    }
  };
  useEffect(() => {
    void refreshLive();
    const timer = window.setInterval(() => void refreshLive(), 30000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <>
      <PageHeader
        title="Providers"
        subtitle="Find useful people and organisations, or offer what you can do."
      />
      <div className="rounded-2xl border border-border bg-elevated/60 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        Kurukoo keeps provider information useful and evidence-led. The profiles below are a
        product preview; availability and commitments are only confirmed when connected evidence
        is available.
      </div>
      <Tabs items={tabs} value={tab} onChange={setTab} />
      {tab === "Find help" ? (
        <div className="mt-4 grid gap-4">
          {liveProviders.length || discoveredProviders.length ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Connected discovery</p>
                  <h2 className="mt-1 text-[17px] font-semibold">Providers visible now</h2>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">Live signals refresh automatically. A signal is not a promise of price or fulfilment.</p>
                </div>
                <button type="button" onClick={() => void refreshLive()} disabled={loadingLive} className="grid size-8 shrink-0 place-items-center rounded-lg border border-border hover:bg-elevated disabled:opacity-50" aria-label="Refresh provider discovery">
                  <RefreshCw className={`size-3.5 ${loadingLive ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="grid gap-3">
                {liveProviders.map((provider) => <LiveProviderCard key={provider.id} provider={provider} />)}
                {discoveredProviders.map((entity) => <DiscoveryProviderCard key={`discovery-${entity.id}`} entity={entity} />)}
              </div>
            </section>
          ) : null}
          {liveError ? <div className="rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-[12px] text-muted-foreground">Connected provider discovery is not available right now. The product preview remains below.</div> : null}
          <section className="grid gap-3">
            <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Provider directory</h2><Badge tone="quiet">Product preview</Badge></div>
            {providers.map((p) => <EntityCard key={p.id} entity={p} />)}
            <div className="rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">Preview data.</span> These provider
              examples show how discovery is intended to look. Live availability, request handling
              and provider evidence become active when the provider connection is enabled.
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <PulseControl />
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15.5px] font-medium">Build your provider profile</p>
              <Badge tone="quiet">Preview flow</Badge>
            </div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Tell Kurukoo what you can do, where you work and when you can accept requests.
              Verification helps people know when they can rely on your profile.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Action variant="primary">Start onboarding</Action>
              <Action>Verify identity</Action>
              <Link to="/pricing" className={actionClass()}>See provider plan</Link>
              <Link to="/wallet" className={actionClass()}>Open wallet</Link>
              <Link to="/advertising" className={actionClass()}>Advertise</Link>
            </div>
          </Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Open requests" value="0" note="Ready when connected" />
            <StatTile label="Active work" value="0" note="Work appears here" />
            <StatTile label="Earnings" value="£0.00" note="Payouts when connected" />
          </div>
          <section>
            <SectionHeader title="How earning works" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Panel className="p-4"><p className="text-[13.5px] font-semibold">1. Get discovered</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Build a clear profile and let relevant requests find you. Nearby Pulse is optional and temporary.</p></Panel>
              <Panel className="p-4"><p className="text-[13.5px] font-semibold">2. Accept work</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Review the request and approve the work before a commitment is made.</p></Panel>
              <Panel className="p-4"><p className="text-[13.5px] font-semibold">3. Get paid</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Completed paid work can flow through the wallet and payout layer when connected.</p></Panel>
            </div>
          </section>
          <section>
            <SectionHeader title="Your provider tools" />
            <Rows>
              {[
                ["Capabilities", "Tell Kurukoo what you can provide", "/capabilities"],
                ["Availability", "Go Live on Nearby Pulse when you are ready", "/discover"],
                ["Incoming requests", "Requests waiting for your response", "/work"],
                ["Messages", "Customer and provider conversations", "/messages"],
                ["Trust & verification", "Identity and provider evidence", "/settings"],
                ["Customers", "Relationships created through completed work", "/contacts"],
                ["Insights", "Activity and useful performance context", "/activity"],
                ["Payments", "Wallet, points and payouts", "/wallet"],
              ].map(([title, note, to]) => (
                <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="min-w-0"><span className="block text-[15px]">{title}</span><span className="block text-[13px] text-muted-foreground">{note}</span></span>
                  <Link to={to as never} className="shrink-0 text-[12px] font-medium underline">Open</Link>
                </li>
              ))}
            </Rows>
          </section>
        </div>
      )}
    </>
  );
}