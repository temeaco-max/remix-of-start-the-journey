import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app-shell";
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

  return (
    <>
      <PageHeader title="Memory" subtitle="What Kurukoo remembers, so you don't repeat yourself." />
      {memory.length === 0 ? (
        <EmptyState
          title="Nothing remembered yet"
          body="As you talk to Kurukoo, the details worth keeping will be collected here — and you stay in control of them."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {memory.map((m) => (
            <li key={m.id} className="px-4 py-3.5">
              <p className="text-[13px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-[15px]">{m.value}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{m.source}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
