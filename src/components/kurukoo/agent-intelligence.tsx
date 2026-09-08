import { Link } from "@tanstack/react-router";
import { Bot, MapPin, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchDiscoveryEntities,
  fetchProactiveFeed,
  type DiscoveryEntity,
  type ProactiveOpportunity,
} from "@/lib/kurukoo-api";
import { Badge, Panel } from "@/components/kurukoo/ui";

type AgentIntelligenceProps = {
  compact?: boolean;
  title?: string;
  maxItems?: number;
};

function pretty(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function attentionType(type: string) {
  const value = type.toLowerCase();
  if (/(urgent|immediate|approval|waiting|action|request)/.test(value)) return "IMMEDIATE";
  if (/(notify|alert|response|change)/.test(value)) return "NOTIFY";
  if (/(reminder|opportunity|event|topic|price|task|goal)/.test(value)) return "NEXT BRIEF";
  return "SILENT";
}

export function AgentIntelligence({ compact = false, title = "Kurukoo intelligence", maxItems = 4 }: AgentIntelligenceProps) {
  const [opportunities, setOpportunities] = useState<ProactiveOpportunity[]>([]);
  const [agentEntities, setAgentEntities] = useState<DiscoveryEntity[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [feed, discovery] = await Promise.allSettled([
        fetchProactiveFeed(),
        fetchDiscoveryEntities({ layers: ["agents"] }),
      ]);
      if (cancelled) return;
      if (feed.status === "fulfilled") {
        setOpportunities(feed.value);
        setConnected(true);
      }
      if (discovery.status === "fulfilled") {
        setAgentEntities(discovery.value);
        setConnected(true);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const items = useMemo(() => opportunities
    .filter((item) => item.status.toLowerCase() !== "dismissed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems), [maxItems, opportunities]);

  const entities = agentEntities.slice(0, Math.max(1, maxItems - items.length));

  if (compact) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Bot className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold">{title}</p>
            <p className="text-[10.5px] text-muted-foreground">{connected ? "Agent-generated signals from Kurukoo" : "Agent layer ready"}</p>
          </div>
          <Badge tone="quiet">{items.length + entities.length}</Badge>
        </div>
        {(items.length || entities.length) ? (
          <div className="mt-3 space-y-2">
            {items.slice(0, 2).map((item) => <div key={item.id} className="rounded-xl bg-elevated/60 p-2.5"><div className="flex items-center gap-2"><Zap className="size-3 text-primary" /><span className="text-[11px] font-medium">{item.title}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{item.subtitle}</p></div>)}
            {entities.slice(0, 2).map((entity) => <div key={entity.id} className="rounded-xl bg-elevated/60 p-2.5"><div className="flex items-center gap-2"><MapPin className="size-3 text-primary" /><span className="text-[11px] font-medium">{entity.name}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{entity.description || entity.category || "Agent-discovered local signal"}</p></div>)}
          </div>
        ) : <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">No agent signal needs to interrupt you right now. Kurukoo will surface useful changes when supported by its connected runtime.</p>}
      </div>
    );
  }

  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span className="grid size-8 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Bot className="size-4" /></span>
        <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">Agent-generated context is surfaced here before it becomes a user-facing action.</p></div>
        <Badge tone="quiet">{connected ? "Connected" : "Ready"}</Badge>
      </div>
      {(items.length || entities.length) ? <div className="divide-y divide-border/70">
        {items.map((item) => <Link key={item.id} to={item.ctaLink as never} className="block px-4 py-3 hover:bg-elevated"><div className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /><span className="text-[12.5px] font-medium">{item.title}</span><Badge>{attentionType(item.type)}</Badge></div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.subtitle}</p><p className="mt-1 text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">Agent signal · {pretty(item.type)}</p></Link>)}
        {entities.map((entity) => <Link key={entity.id} to="/discover" className="block px-4 py-3 hover:bg-elevated"><div className="flex items-center gap-2"><MapPin className="size-3.5 text-primary" /><span className="text-[12.5px] font-medium">{entity.name}</span><Badge>{entity.liveNow ? "Live now" : entity.available ? "Available" : "Context"}</Badge></div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{entity.description || entity.category || "Agent-discovered signal"}</p><p className="mt-1 text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">Agent discovery · {entity.source || "connected source"}</p></Link>)}
      </div> : <div className="px-4 py-4 text-[11.5px] leading-relaxed text-muted-foreground">No agent-generated signal is currently being surfaced. This is intentional: Kurukoo should stay quiet rather than manufacture activity. When its runtime has useful context, it can appear here and flow into Radar, Nearby, Topics, Work or Chat.</div>}
    </Panel>
  );
}
