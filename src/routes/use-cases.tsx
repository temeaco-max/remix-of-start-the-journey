import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";

export const Route = createFileRoute("/use-cases")({
  head: () => ({
    meta: [
      { title: "What Kurukoo can do — everyday AI use cases" },
      {
        name: "description",
        content:
          "Explore real everyday jobs you can hand to Kurukoo, from home repairs and appointments to quotes, errands, work and local discovery.",
      },
      { property: "og:title", content: "What Kurukoo can do" },
      { property: "og:description", content: "Real everyday jobs you can hand over to Kurukoo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/use-cases" },
    ],
    links: [{ rel: "canonical", href: "/use-cases" }],
  }),
  component: UseCasesPage,
});

const groups = [
  {
    title: "Home and repairs",
    body: "A leaking tap, a boiler service, a broken screen, a locksmith at short notice.",
    examples: ["Find me a plumber who can come this week.", "Get my boiler serviced before winter.", "Someone to fix a cracked phone screen nearby."],
  },
  {
    title: "Appointments and health",
    body: "Dentists, opticians, physios, garages, vets — found, compared and booked with your say-so.",
    examples: ["Book me a dentist on a Saturday.", "Find a vet who can see a cat tomorrow.", "MOT booked somewhere close to work."],
  },
  {
    title: "Quotes and comparisons",
    body: "Kurukoo can organise several provider responses into a useful comparison when the relevant service is available.",
    examples: ["Three quotes for painting a two-bed flat.", "Cheapest reliable option for a house move.", "Compare broadband at my address."],
  },
  {
    title: "Errands and admin",
    body: "The small jobs that otherwise take an afternoon of phone calls and follow-ups.",
    examples: ["Chase my delivery and tell me when it lands.", "Cancel a subscription I no longer use.", "Arrange a courier for a large parcel."],
  },
  {
    title: "For businesses and providers",
    body: "Requests can arrive already understood, with the context needed to answer and keep the work moving.",
    examples: ["See incoming requests", "Reply and quote", "Keep the work in one thread"],
  },
  {
    title: "For creators",
    body: "Recommend the things you rate and make it easier for people to act on useful recommendations.",
    examples: ["Recommend a product", "Recommend a place", "Turn a guide into an action"],
  },
];

function UseCasesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-9 pb-4">
      <header className="max-w-3xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Use cases</p>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[50px]">What can Kurukoo get done?</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">If it is a legitimate job and the relevant people, services or systems can support it, start by telling Kurukoo the outcome you want.</p>
        <div className="mt-5"><AskKurukoo prompt="What can Kurukoo help me get done?" /></div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <article key={group.title} className="rounded-[20px] border border-border bg-surface p-5">
            <h2 className="font-serif text-[24px] leading-[1.05] tracking-[-0.03em]">{group.title}</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{group.body}</p>
            <ul className="mt-4 space-y-2">
              {group.examples.map((example) => <li key={example} className="rounded-xl bg-elevated/60 px-3 py-2 text-[12px] text-muted-foreground">“{example}”</li>)}
            </ul>
          </article>
        ))}
      </div>

      <section className="rounded-[22px] border border-border bg-elevated/35 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ready to try one?</p><h2 className="mt-1.5 font-serif text-[27px] leading-[1.05] tracking-[-0.035em]">Start with whatever is annoying you most today.</h2></div>
          <div className="flex shrink-0 flex-wrap gap-2"><Link to="/chat" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[11.5px] font-medium text-primary-foreground">Get started <ArrowRight className="size-3.5" /></Link><Link to="/explore" className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-[11.5px] font-medium">Explore</Link></div>
        </div>
      </section>

      <FAQSection
        items={[
          { question: "What kinds of jobs can I hand to Kurukoo?", answer: "Everyday requests across areas such as food, groceries, mobility, home and repairs, work, selling, health, events, community and safety can be useful starting points. The exact action depends on the available service and evidence." },
          { question: "Can Kurukoo book or buy something for me?", answer: "Where a supported flow exists, Kurukoo can coordinate the request and ask for the approvals needed before an external commitment is made. It should never claim a booking or purchase without confirmation." },
          { question: "Can I just describe the job instead of choosing a category?", answer: "Yes. Chat is the universal entry point. Explore is there when you want a visual starting point rather than beginning with a blank conversation." },
        ]}
      />
    </div>
  );
}
