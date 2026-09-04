import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/kurukoo/ui";
import { articles } from "@/lib/kurukoo-demo";

const description =
  "Kurukoo is AI that gets things done. Tell it what you need — a plumber, a dentist, three quotes, a chased delivery — and it finds the right people, checks with you, and reports back.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kurukoo — AI that gets things done" },
      { name: "description", content: description },
      { property: "og:title", content: "Kurukoo — AI that gets things done" },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: "Kurukoo — AI that gets things done" },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Kurukoo",
          description,
          potentialAction: {
            "@type": "SearchAction",
            target: "/explore?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});

const steps = [
  ["Say what you need", "Plain words — no forms, no categories, no shortlists to build."],
  ["Kurukoo works it out", "It fills in the detail and asks only what it genuinely needs."],
  ["It does the running around", "Reaching the right people, comparing what comes back."],
  ["You decide", "Nothing is booked or paid for until you say yes."],
];

const outcomes = [
  ["A plumber, booked", "Not a list of ten numbers to ring yourself."],
  ["Three real quotes", "Asked for, chased, and lined up side by side."],
  ["An appointment that fits", "Around your week, not the first slot going."],
  ["A delivery chased", "Kurukoo follows up so you stop checking."],
];

function LandingPage() {
  return (
    <>
      <section className="py-8 md:py-16">
        <p className="text-[13.5px] uppercase tracking-wide text-muted-foreground">
          AI that gets things done
        </p>
        <h1 className="mt-3 max-w-3xl text-[36px] font-semibold leading-[1.08] tracking-tight md:text-[58px]">
          Tell Kurukoo what you need. It gets to work.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            to="/about"
            className="inline-flex min-h-12 items-center rounded-full border border-border px-6 text-[15px] transition-colors hover:bg-elevated"
          >
            See how it works
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center px-2 text-[15px] text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          Prototype build — Kurukoo doesn't contact real businesses yet, and it tells you so as you
          use it.
        </p>
      </section>

      <section className="border-t border-border py-12">
        <h2 className="text-[22px] font-semibold tracking-tight">What you actually get</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {outcomes.map(([title, body]) => (
            <Panel key={title} className="p-5">
              <p className="text-[15.5px] font-medium">{title}</p>
              <p className="mt-1 text-[14px] text-muted-foreground">{body}</p>
            </Panel>
          ))}
        </div>
        <Link to="/use-cases" className="mt-5 inline-block text-[14px] underline">
          See everything Kurukoo can do
        </Link>
      </section>

      <section className="border-t border-border py-12">
        <h2 className="text-[22px] font-semibold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="grid size-7 place-items-center rounded-full bg-elevated text-[13px] font-medium">
                {i + 1}
              </span>
              <p className="mt-3 text-[15px] font-medium">{title}</p>
              <p className="mt-1 text-[14px] text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border py-12">
        <h2 className="text-[22px] font-semibold tracking-tight">Kurukoo for</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              to: "/providers",
              title: "Providers",
              body: "Requests that arrive already understood.",
            },
            {
              to: "/businesses",
              title: "Businesses",
              body: "Customers, work and messages in one place.",
            },
            {
              to: "/creators",
              title: "Creators",
              body: "Recommend things people can act on immediately.",
            },
          ].map((c) => (
            <Link key={c.to} to={c.to}>
              <Panel className="h-full p-5 transition-colors hover:bg-elevated/60">
                <p className="text-[15.5px] font-medium">{c.title}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{c.body}</p>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-12">
        <h2 className="text-[22px] font-semibold tracking-tight">From the blog</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <li key={a.slug}>
              <Link to="/blog/$slug" params={{ slug: a.slug }}>
                <Panel className="h-full p-5 transition-colors hover:bg-elevated/60">
                  <p className="text-[15px] font-medium">{a.title}</p>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{a.excerpt}</p>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border py-12">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Stop chasing. Start handing things over.
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground"
          >
            Get started
          </Link>
          <Link
            to="/pricing"
            className="inline-flex min-h-12 items-center rounded-full border border-border px-6 text-[15px]"
          >
            See pricing
          </Link>
        </div>
      </section>
    </>
  );
}
