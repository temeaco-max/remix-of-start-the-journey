import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { MarketingPage } from "@/components/kurukoo/marketing";
import { Panel, Rows, SectionHeader } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kurukoo" },
      {
        name: "description",
        content: "Reach the Kurukoo team about support, partnerships or press.",
      },
      { property: "og:title", content: "Contact — Kurukoo" },
      { property: "og:description", content: "Support, partnerships and press enquiries." },
    ],
  }),
  component: ContactPage,
});

const routes = [
  ["Support", "Something isn't working, or you need a hand with a request.", "/"],
  ["Partnerships", "Businesses and organisations wanting to work with Kurukoo.", "/network"],
  ["Press", "Questions about the product or the company.", null],
] as Array<[string, string, string | null]>;

function ContactPage() {
  return (
    <MarketingPage>
      <PageHeader
        title="Contact"
        subtitle="Tell us what you need and we'll point it the right way."
      />

      <Panel className="p-4">
        <p className="text-[15px] font-medium">The quickest route is the conversation</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Ask Kurukoo directly and it will pass anything it can't handle to a person.
        </p>
        <Link to="/" className="mt-3 inline-block">
          <Action variant="primary">Ask Kurukoo</Action>
        </Link>
      </Panel>

      <section className="mt-8">
        <SectionHeader title="Other enquiries" />
        <Rows>
          {routes.map(([title, note, href]) => (
            <li key={title} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[15px]">{title}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{note}</p>
              </div>
              {href ? (
                <Link to={href as never} className="shrink-0 text-[13.5px] underline">
                  Open
                </Link>
              ) : (
                <span className="shrink-0 text-[12px] text-muted-foreground">Soon</span>
              )}
            </li>
          ))}
        </Rows>
      </section>

      <IntegrationGap>
        Press enquiries have no dedicated channel yet — check the blog and about pages for
        the latest public information. Contact forms and email routing are not connected
        yet, so no addresses are shown here.
      </IntegrationGap>
    </MarketingPage>
  );
}
