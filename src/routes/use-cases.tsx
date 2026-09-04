import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/use-cases")({
  head: () => ({
    meta: [
      { title: "What Kurukoo can do — use cases" },
      {
        name: "description",
        content:
          "Home repairs, appointments, quotes, deliveries, admin and errands: real things people hand to Kurukoo instead of chasing themselves.",
      },
      { property: "og:title", content: "What Kurukoo can do — use cases" },
      {
        property: "og:description",
        content: "Real everyday jobs you can hand over to Kurukoo.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/use-cases" },
    ],
    links: [{ rel: "canonical", href: "/use-cases" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "What Kurukoo can do",
          itemListElement: groups.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: g.title,
          })),
        }),
      },
    ],
  }),
  component: UseCasesPage,
});

const groups = [
  {
    title: "Home and repairs",
    body: "A leaking tap, a boiler service, a broken screen, a locksmith at short notice.",
    examples: [
      "Find me a plumber who can come this week.",
      "Get my boiler serviced before winter.",
      "Someone to fix a cracked phone screen nearby.",
    ],
  },
  {
    title: "Appointments and health",
    body: "Dentists, opticians, physios, garages, vets — found, compared and booked with your say-so.",
    examples: [
      "Book me a dentist on a Saturday.",
      "Find a vet who can see a cat tomorrow.",
      "MOT booked somewhere close to work.",
    ],
  },
  {
    title: "Quotes and comparisons",
    body: "Kurukoo asks several providers, lines up the answers, and shows you the difference.",
    examples: [
      "Three quotes for painting a two-bed flat.",
      "Cheapest reliable option for a house move.",
      "Compare broadband at my address.",
    ],
  },
  {
    title: "Errands and admin",
    body: "The small jobs that take an afternoon of phone calls.",
    examples: [
      "Chase my delivery and tell me when it lands.",
      "Cancel a subscription I no longer use.",
      "Arrange a courier for a large parcel.",
    ],
  },
  {
    title: "For businesses and providers",
    body: "Requests arrive already understood, with the context needed to answer.",
    examples: ["See incoming requests", "Reply and quote", "Keep the work in one thread"],
  },
  {
    title: "For creators",
    body: "Recommend the things you rate, and let people act on them in one step.",
    examples: ["Recommend a product", "Recommend a place", "Turn a video into an action"],
  },
];

function UseCasesPage() {
  return (
    <>
      <PageHeader
        title="What Kurukoo can do"
        subtitle="If it's legitimate and someone can do it, you can ask for it."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title} className="p-5">
            <h2 className="text-[16px] font-semibold">{g.title}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">{g.body}</p>
            <ul className="mt-3 space-y-1.5">
              {g.examples.map((e) => (
                <li key={e} className="text-[13.5px] text-muted-foreground">
                  “{e}”
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <section className="mt-12">
        <SectionHeader
          title="Ready to try one?"
          subtitle="Start with whatever is annoying you most today."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            to="/chat"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground"
          >
            Get started
          </Link>
          <Link
            to="/about"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-[15px]"
          >
            See how it works
          </Link>
        </div>
      </section>
    </>
  );
}
