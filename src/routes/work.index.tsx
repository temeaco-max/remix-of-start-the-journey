import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { WorkItemCard } from "@/components/kurukoo/primitives";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/work/")({
  head: () => ({
    meta: [
      { title: "Work — Kurukoo" },
      {
        name: "description",
        content: "Everything Kurukoo is handling for you, and what it needs from you.",
      },
      { property: "og:title", content: "Work — Kurukoo" },
      {
        property: "og:description",
        content: "Track requests Kurukoo is carrying out on your behalf.",
      },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const { work, advance } = useKurukoo();

  return (
    <>
      <PageHeader title="Work" subtitle="What Kurukoo is taking care of right now." />
      {work.length === 0 ? (
        <EmptyState
          title="Nothing in flight"
          body="Ask Kurukoo for something on Home and it will show up here as it makes progress."
        />
      ) : (
        <ul className="space-y-3">
          {work.map((item) => (
            <li key={item.id}>
              <WorkItemCard item={item} onAdvance={advance} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
