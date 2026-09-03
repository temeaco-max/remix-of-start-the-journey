import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Kurukoo" },
      { name: "description", content: "Discover the kinds of things you can ask Kurukoo to take care of." },
      { property: "og:title", content: "Explore — Kurukoo" },
      { property: "og:description", content: "Ideas and starting points for what Kurukoo can do for you." },
    ],
  }),
  component: ExplorePage,
});

const groups = [
  {
    title: "Around the home",
    items: ["Find me a plumber.", "Get my boiler serviced.", "Someone to fix a leaking tap."],
  },
  {
    title: "Health and appointments",
    items: ["Book me a dentist.", "Find a GP appointment this week.", "Reschedule my optician."],
  },
  {
    title: "Repairs and devices",
    items: ["I need someone to repair my phone.", "Fix my laptop screen.", "Find the cheapest option."],
  },
  {
    title: "Everyday",
    items: ["Remind me tomorrow.", "Message John.", "What am I waiting for?"],
  },
];

function ExplorePage() {
  const { send } = useKurukoo();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Explore" subtitle="Things people ask Kurukoo for. Tap one to start." />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-[13px] uppercase tracking-wide text-muted-foreground">{g.title}</h2>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {g.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => {
                      send(item);
                      navigate({ to: "/" });
                    }}
                    className="w-full px-4 py-3 text-left text-[15px] transition-colors hover:bg-elevated"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
