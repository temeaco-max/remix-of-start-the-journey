import { createFileRoute } from "@tanstack/react-router";
import { Brain, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, ContextIconTile, Panel } from "@/components/kurukoo/ui";
import { fetchCanonicalMemoryFacts, revokeCanonicalMemoryFact, type CanonicalMemoryFact } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory — Kurukoo" },
      { name: "description", content: "What Kurukoo remembers about you, so you never repeat yourself." },
      { property: "og:title", content: "Memory — Kurukoo" },
      { property: "og:description", content: "What Kurukoo remembers about you and your preferences." },
    ],
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const [facts, setFacts] = useState<CanonicalMemoryFact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  async function load() { setLoading(true); setError(""); try { setFacts(await fetchCanonicalMemoryFacts()); } catch (e) { setFacts([]); setError(e instanceof Error ? e.message : "Unable to load your memory."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => { const q=query.trim().toLowerCase(); return q ? facts.filter((f)=>`${f.field} ${f.value} ${f.provenance ?? ""}`.toLowerCase().includes(q)) : facts; }, [facts,query]);
  async function remove(id:number) { if(!window.confirm("Remove this detail from your active Kurukoo memory?")) return; setBusyId(id); try { await revokeCanonicalMemoryFact(id); setFacts((items)=>items.filter((fact)=>fact.id!==id)); } catch(e) { setError(e instanceof Error ? e.message : "Unable to remove this memory detail."); } finally { setBusyId(null); } }
  return <div className="space-y-7"><PageHeader title="Memory" subtitle="Useful details Kurukoo can carry forward. Memory supports continuity; it never becomes proof of current availability, price or fulfilment." />
    <Panel className="overflow-hidden"><div className="flex flex-col gap-5 p-5 sm:p-6"><div className="flex items-start gap-3.5"><ContextIconTile className="size-11 rounded-2xl bg-elevated/80"><Brain className="size-[19px]" /></ContextIconTile><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-medium text-muted-foreground">Your context</p><Badge tone="success">Private</Badge></div><h2 className="mt-1 text-[22px] font-semibold tracking-tight">Kurukoo remembers the useful bits.</h2><p className="mt-1 max-w-2xl text-[13.5px] leading-5 text-muted-foreground">You can review active memory and remove a detail at any time.</p></div></div><div className="grid gap-3 rounded-2xl bg-background p-3 sm:grid-cols-2"><div className="flex items-start gap-3 p-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-[13.5px] font-medium">Memory is continuity, not permission</p><p className="mt-0.5 text-[12.5px] text-muted-foreground">Remembering something never authorises a consequential action.</p></div></div><div className="flex items-start gap-3 p-2"><SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-[13.5px] font-medium">You control retained details</p><p className="mt-0.5 text-[12.5px] text-muted-foreground">Remove an active detail and Kurukoo will stop using it as retained context.</p></div></div></div><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><label htmlFor="memory-search" className="sr-only">Search memory</label><input id="memory-search" type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search remembered details" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></div></div></Panel>
    <section><div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-[17px] font-semibold">Active memory</h2><p className="mt-0.5 text-[13px] text-muted-foreground">{visible.length} of {facts.length} retained details</p></div></div>{loading ? <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" /> : error ? <EmptyState title="Memory could not load" body={error} /> : visible.length===0 ? <EmptyState title={facts.length ? "No matching memory" : "Nothing remembered yet"} body={facts.length ? "Try another search term." : "As you talk to Kurukoo, useful details can be retained here when the canonical memory service records them."} /> : <Panel className="overflow-hidden"><ul className="divide-y divide-border">{visible.map((fact)=><li key={fact.id} className="flex items-start gap-3 px-4 py-4 sm:px-5"><Avatar name={fact.field} size={38} /><div className="min-w-0 flex-1"><p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{fact.field.replace(/[_-]/g," ")}</p><p className="mt-1 text-[15px] font-medium">{fact.value}</p><p className="mt-1.5 text-[11.5px] text-muted-foreground">{fact.provenance ? `Source: ${fact.provenance}` : "Source recorded by Kurukoo"}{fact.observedAt ? ` · Observed ${new Date(fact.observedAt).toLocaleDateString()}` : ""}</p></div><button type="button" onClick={()=>void remove(fact.id)} disabled={busyId===fact.id} className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-[11px] text-muted-foreground hover:bg-elevated disabled:opacity-50">{busyId===fact.id ? "Removing…" : "Remove"}</button></li>)}</ul></Panel>}</section>
    <p className="text-[11px] text-muted-foreground">Your active memory is owner-scoped by the canonical Kurukoo memory service. Removing a fact does not alter past conversations or external systems.</p>
  </div>;
}