import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CarFront,
  CircleAlert,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Search,
  Store,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { Badge, Panel, SectionHeader, Tabs } from "@/components/kurukoo/ui";
import {
  fetchDiscoveryEntities,
  fetchDiscoveryMap,
  fetchPublicPulseProviders,
  fetchPulseReadiness,
  type DiscoveryEntity,
  type PulseProvider,
  type PulseReadiness,
} from "@/lib/kurukoo-api";
import { PulseControl } from "@/components/kurukoo/pulse-control";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Nearby — Kurukoo" },
      {
        name: "description",
        content:
          "See useful people, providers, businesses, offers, events and live local activity around you.",
      },
      { property: "og:title", content: "Nearby — Kurukoo" },
      {
        property: "og:description",
        content: "Your local Kurukoo view: what is nearby, what is live and what is useful now.",
      },
    ],
  }),
  component: NearbyPage,
});
const layers = [
  "Everything",
  "Live now",
  "Places & businesses",
  "Offers",
  "Events",
  "Opportunities",
] as const;
const iconFor = (kind: string, live = false) =>
  live
    ? Navigation
    : kind.includes("business") || kind.includes("place")
      ? Store
      : kind.includes("delivery") || kind.includes("transport")
        ? CarFront
        : kind.includes("deal") || kind.includes("offer")
          ? Tag
          : kind.includes("event")
            ? MapPin
            : kind.includes("opportun")
              ? Zap
              : Users;
const pretty = (value: string) =>
  value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
function discoveryContext(entity: DiscoveryEntity) {
  const evidence = entity.evidence ? pretty(entity.evidence) : "source-attributed";
  const availability = entity.liveNow
    ? "live now"
    : entity.available === true
      ? "available"
      : "availability not confirmed";
  return [
    `I found this through Kurukoo Nearby: ${entity.name}.`,
    `Type: ${pretty(entity.category ?? entity.kind)}.`,
    entity.location ? `Approximate area: ${entity.location}.` : "",
    `Evidence: ${evidence}. Availability: ${availability}.`,
    entity.freshness ? `Freshness: ${entity.freshness}.` : "",
    entity.source ? `Source: ${entity.source}.` : "",
    entity.description ? `Description: ${entity.description}` : "",
    "Treat community or claimed information as context, not fulfilment proof. Help me decide whether this is relevant and, if appropriate, move me into a verified request without inventing availability, price or capability.",
  ]
    .filter(Boolean)
    .join("\n");
}
function SignalCard({ entity, pulse }: { entity?: DiscoveryEntity; pulse?: PulseProvider }) {
  const { send } = useKurukoo();
  const live = Boolean(pulse);
  const name = pulse?.name ?? entity?.name ?? "Nearby item";
  const skill = pulse?.skill ?? entity?.category ?? entity?.kind ?? "Local discovery";
  const Icon = iconFor(String(skill).toLowerCase(), live);
  const evidence = entity?.evidence ? pretty(entity.evidence) : live ? "Verified live signal" : "Source attributed";
  const freshness = entity?.freshness;
  const available = live || entity?.available === true;
  const context = entity
    ? discoveryContext(entity)
    : `I found ${name} through Kurukoo Pulse as a verified live provider signal. Skill: ${skill}. Location is approximate. Help me understand whether I should use this provider and, if appropriate, move into a verified request. Do not invent price or availability beyond this live signal.`;
  const ask = () => send(context);
  return (
    <article className="rounded-[18px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/45">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold">{name}</p>
            {live ? <Badge tone="success">Live now</Badge> : available ? <Badge tone="success">Available</Badge> : <Badge>Not confirmed</Badge>}
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {pretty(String(skill))}
            {(pulse?.location ?? entity?.location)
              ? ` · ${pulse?.location ?? entity?.location}`
              : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
            <span>{evidence}</span>
            {freshness ? <span>· {freshness}</span> : null}
            {entity?.lifecycle ? <span>· {pretty(entity.lifecycle)}</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={ask}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-medium text-primary-foreground"
        >
          Ask Kurukoo about this <ArrowUpRight className="size-3.5" />
        </button>
        {live ? (
          <button
            type="button"
            onClick={ask}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium hover:bg-elevated"
          >
            Check the next step
          </button>
        ) : null}
      </div>
    </article>
  );
}
function DiscoveryMap({
  features,
  located,
}: {
  features: Array<{
    geometry?: { coordinates?: [number, number] };
    properties?: Record<string, unknown>;
  }>;
  located: boolean;
}) {
  const points = features.flatMap((feature, index) => {
    const coords = feature.geometry?.coordinates;
    if (!coords) return [];
    return [
      {
        key: String(feature.properties?.["id"] ?? index),
        lng: Number(coords[0]),
        lat: Number(coords[1]),
        name: String(feature.properties?.["name"] ?? feature.properties?.["title"] ?? "Nearby"),
      },
    ];
  });
  const lngs = points.map((p) => p.lng),
    lats = points.map((p) => p.lat);
  const minLng = lngs.length ? Math.min(...lngs) : 0,
    maxLng = lngs.length ? Math.max(...lngs) : 1,
    minLat = lats.length ? Math.min(...lats) : 0,
    maxLat = lats.length ? Math.max(...lats) : 1;
  const dx = maxLng - minLng || 1,
    dy = maxLat - minLat || 1;
  return (
    <Panel className="overflow-hidden p-0">
      <div className="relative bg-elevated/45 p-3">
        <svg
          viewBox="0 0 100 100"
          className="h-[410px] w-full rounded-[18px] border border-border bg-background"
          role="img"
          aria-label="Approximate Nearby discovery map"
        >
          <defs>
            <pattern id="nearby-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="currentColor"
                strokeOpacity=".07"
                strokeWidth=".4"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#nearby-grid)" />
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="currentColor"
            fillOpacity=".05"
            stroke="currentColor"
            strokeOpacity=".15"
          />
          <circle cx="50" cy="50" r="2.2" fill="currentColor" fillOpacity=".45" />
          <text
            x="50"
            y="56"
            textAnchor="middle"
            fontSize="3"
            fill="currentColor"
            fillOpacity=".55"
          >
            {located ? "Your area" : "Approximate area"}
          </text>
          {points.slice(0, 30).map((point) => {
            const x = 8 + ((point.lng - minLng) / dx) * 84,
              y = 92 - ((point.lat - minLat) / dy) * 84;
            return (
              <g key={point.key}>
                <circle cx={x} cy={y} r="2" fill="currentColor" fillOpacity=".72" />
                <title>{point.name}</title>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] font-medium">Map view</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            {located
              ? "Your location centres this session. Public provider positions remain approximate."
              : "Use your location to centre the local view. Exact provider coordinates are never shown publicly."}
          </p>
        </div>
      </div>
    </Panel>
  );
}
function Radar({ readiness }: { readiness: PulseReadiness | null }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-brand-tint text-brand-ink">
            <Navigation className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Nearby Radar</p>
            <p className="text-[10.5px] text-muted-foreground">Your local attention layer</p>
          </div>
        </div>
        <span className="rounded-full bg-elevated px-2 py-1 text-[10px] font-medium">
          {readiness ? (readiness.radarDefaultOn ? "On" : "Off") : "Checking…"}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-[15px] font-semibold">
          {readiness?.active ? "You are live on Pulse" : "Let Kurukoo notice what matters nearby."}
        </p>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
          {readiness?.active
            ? readiness.nudge
            : "Radar does not broadcast you. It interprets useful local signals and can surface a nudge when something relevant is happening nearby."}
        </p>
      </div>
    </Panel>
  );
}
function NearbyPage() {
  const [layer, setLayer] = useState<string>(layers[0]);
  const [q, setQ] = useState("");
  const [entities, setEntities] = useState<DiscoveryEntity[]>([]);
  const [pulses, setPulses] = useState<PulseProvider[]>([]);
  const [features, setFeatures] = useState<
    Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown> }>
  >([]);
  const [readiness, setReadiness] = useState<PulseReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [located, setLocated] = useState(false);
  const load = async (position?: GeolocationPosition) => {
    setLoading(true);
    setError("");
    try {
      const opts = position
        ? { lat: position.coords.latitude, lng: position.coords.longitude, radius: 5000 }
        : { radius: 5000 };
      const [entityData, pulseData, mapData] = await Promise.all([
        fetchDiscoveryEntities(opts),
        fetchPublicPulseProviders(),
        fetchDiscoveryMap(opts),
      ]);
      setEntities(entityData);
      setPulses(pulseData);
      setFeatures(mapData.features ?? []);
    } catch (e) {
      setEntities([]);
      setPulses([]);
      setFeatures([]);
      setError(e instanceof Error ? e.message : "Nearby discovery is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };
  const loadRadar = async () => {
    try {
      setReadiness(await fetchPulseReadiness());
    } catch {
      setReadiness(null);
    }
  };
  useEffect(() => {
    void load();
    void loadRadar();
    const timer = window.setInterval(() => {
      void load();
      void loadRadar();
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const locate = () => {
    if (!navigator.geolocation) {
      setError("Your browser cannot provide location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocated(true);
        void load(p);
      },
      () => {
        setError(
          "Location was not granted. Nearby can still show source-attributed local discovery without centring on you.",
        );
        void load();
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
  };
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entities.filter((e) => {
      const text = [
        e.name,
        e.kind,
        e.category ?? "",
        e.description ?? "",
        e.location ?? "",
        ...(e.skills ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (term && !text.includes(term)) return false;
      if (layer === "Live now" && !e.liveNow) return false;
      if (
        layer === "Places & businesses" &&
        !["business", "place", "shop", "venue"].some((k) =>
          String(e.kind).toLowerCase().includes(k),
        )
      )
        return false;
      if (
        layer === "Offers" &&
        !["deal", "offer", "promotion"].some((k) =>
          `${e.kind} ${e.category ?? ""}`.toLowerCase().includes(k),
        )
      )
        return false;
      if (layer === "Events" && !String(e.kind).toLowerCase().includes("event")) return false;
      if (layer === "Opportunities" && !String(e.kind).toLowerCase().includes("opportun"))
        return false;
      return true;
    });
  }, [entities, layer, q]);
  return (
    <div className="w-full max-w-6xl space-y-7">
      <PageHeader
        title="Nearby"
        subtitle="Your local view of people, places, providers, offers, events and live activity."
        action={
          <button
            type="button"
            onClick={locate}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11.5px] font-medium hover:bg-elevated"
          >
            <LocateFixed className="size-3.5" />
            {located ? "Location on" : "Use my location"}
          </button>
        }
      />
      <Radar readiness={readiness} />
      <PulseControl />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <SectionHeader
              title="Around you"
              subtitle="Live signals sit alongside ordinary local discovery."
            />
            <button
              type="button"
              onClick={() => {
                void load();
                void loadRadar();
              }}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] text-muted-foreground hover:bg-elevated"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Search Nearby"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search nearby…"
                className="min-h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[12px] outline-none"
              />
            </div>
            <Tabs items={layers} value={layer} onChange={setLayer} />
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-40 animate-pulse rounded-[18px] border border-border bg-surface"
                />
              ))}
            </div>
          ) : error ? (
            <Panel className="p-6">
              <CircleAlert className="size-5 text-muted-foreground" />
              <p className="mt-3 text-[14px] font-medium">Nearby could not load fully</p>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">{error}</p>
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pulses.length && (layer === "Everything" || layer === "Live now")
                ? pulses.map((p) => <SignalCard key={p.id} pulse={p} />)
                : null}
              {filtered.map((e) => (
                <SignalCard key={e.id} entity={e} />
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-3">
          <DiscoveryMap features={features} located={located} />
          <Panel className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-[12.5px] font-medium">Turn discovery into action</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  Open something useful, then ask Kurukoo to order, compare, negotiate, contact or
                  coordinate it. Evidence and availability stay separate from community opinion.
                </p>
                <Link
                  to="/chat"
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium"
                >
                  Continue in Conversation <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
