import { createFileRoute } from "@tanstack/react-router";
import { Brain, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, ContextIconTile, Panel } from "@/components/kurukoo/ui";
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
    <div className="space-y-7">
      <PageHeader title="Memory" subtitle="Useful details Kurukoo can carry forward, so you do not have to repeat yourself." />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <ContextIconTile className="size-11 rounded-2xl bg-elevated/80">
              <Brain className="size-[19px]" />
            </ContextIconTile>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-medium text-muted-foreground">Your context</p>
                <Badge tone="success">Private</Badge>
              </div>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">Kurukoo remembers the useful bits.</h2>
              <p className="mt-1 max-w-2xl text-[13.5px] leading-5 text-muted-foreground">Preferences and details can make future requests quicker. You stay in control of what is remembered and how it is used.</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl bg-background p-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div><p className="text-[13.5px] font-medium">Important actions still ask</p><p className="mt-0.5 text-[12.5px] text-muted-foreground">Remembering a preference never becomes permission to commit on your behalf.</p></div>
            </div>
            <div className="flex items-start gap-3 p-2">
              <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div><p className="text-[13.5px] font-medium">You stay in control</p><p className="mt-0.5 text-[12.5px] text-muted-foreground">Persistent editing and deletion will be attached to your account controls.</p></div>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="memory-search" className="sr-only">Search memory</label>
            <input id="memory-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search remembered details" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
      </Panel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div><h2 className="text-[17px] font-semibold">Remembered details</h2><p className="mt-0.5 text-[13px] text-muted-foreground">{visible.length} of {memory.length} details</p></div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title={memory.length ? "No matching memory" : "Nothing remembered yet"} body={memory.length ? "Try another search term." : "As you talk to Kurukoo, useful details can be collected here — and you stay in control of them."} />
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-border">
              {visible.map((m) => (
                <li key={m.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                  <Avatar name={m.label} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-[15px] font-medium">{m.value}</p>
                    <p className="mt-1.5 text-[12.5px] text-muted-foreground">Remembered from {m.source}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </section>

      <IntegrationGap>Memory is kept on this device for now. Saving it to your account, with editing and deletion, is coming.</IntegrationGap>
    </div>
  );
}
