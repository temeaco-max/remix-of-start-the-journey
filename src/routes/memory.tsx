import { createFileRoute } from "@tanstack/react-router";
import { Brain, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, Panel, StatTile } from "@/components/kurukoo/ui";
import { useKurukoo } from "@/lib/kurukoo-store";

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
  const { memory } = useKurukoo();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? memory.filter((m) => `${m.label} ${m.value} ${m.source}`.toLowerCase().includes(q)) : memory;
  }, [memory, query]);

  return (
    <>
      <PageHeader title="Memory" subtitle="Useful details Kurukoo can carry forward — always under your control." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Remembered" value={`${memory.length}`} note="Details in this session" />
        <StatTile label="Private by default" value="On" note="Not shared without a reason" />
        <StatTile label="Control" value="Yours" note="You decide what stays" />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground"><Brain className="size-5" /></span>
          <div><p className="text-[15px] font-medium">Memory should make life easier</p><p className="mt-0.5 text-[13.5px] text-muted-foreground">Kurukoo can use remembered preferences and context to avoid asking you the same thing twice.</p></div>
          <Badge tone="success">Private</Badge>
        </div>
        <div className="flex items-center gap-3 p-4">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">Important actions still require your approval, even when Kurukoo remembers your preferences.</p>
        </div>
      </Panel>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="memory-search" className="sr-only">Search memory</label>
        <input id="memory-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search remembered details" className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <section className="mt-5">
        {visible.length === 0 ? (
          <EmptyState title={memory.length ? "No matching memory" : "Nothing remembered yet"} body={memory.length ? "Try another search term." : "As you talk to Kurukoo, useful details can be collected here — and you stay in control of them."} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((m) => (
              <Panel key={m.id} className="p-4">
                <div className="flex items-start gap-3"><Avatar name={m.label} size={38} /><div className="min-w-0"><p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{m.label}</p><p className="mt-1 text-[15px] font-medium">{m.value}</p><p className="mt-2 text-[12.5px] text-muted-foreground">Source · {m.source}</p></div></div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <IntegrationGap>
        This prototype keeps memory in the browser session. Persistent memory, editing and deletion will use the canonical Kurukoo account backend.
      </IntegrationGap>
    </>
  );
}
