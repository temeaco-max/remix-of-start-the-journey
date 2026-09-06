import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Brain, CalendarClock, CheckCircle2, Compass, CreditCard, FileText, HeartPulse, MessageCircle, Mic2, PackageSearch, ShieldCheck, Wrench, Zap } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AgentCard } from "@/components/kurukoo/cards";
import { Action } from "@/components/kurukoo/primitives";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { agents } from "@/lib/kurukoo-demo";
import { capabilityCount, skillCategories } from "@/lib/skill-catalog";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI agents & assistance — Kurukoo" },
      { name: "description", content: "See what Kurukoo's agents can help you research, arrange, communicate, remember, monitor and get done." },
      { property: "og:title", content: "AI agents & assistance — Kurukoo" },
      { property: "og:description", content: "Real-world jobs Kurukoo can help with through one conversation." },
    ],
  }),
  component: AgentsPage,
});

const agentPowers = [
  [Compass, "Find & compare", "Discover people, providers, products, places, services, prices and opportunities, then compare the useful options."],
  [CalendarClock, "Plan & schedule", "Set reminders, track follow-ups, find suitable times, monitor dates and keep a request moving."],
  [MessageCircle, "Communicate", "Prepare messages, identify the right contact or channel, and hand off communication only after you approve it."],
  [Wrench, "Arrange & coordinate", "Turn a plain request into requirements, provider matching, quotes, reservations, fulfilment and completion."],
  [FileText, "Create & organise", "Prepare documents, capture useful context, manage files and keep outputs attached to the work that produced them."],
  [PackageSearch, "Shop & fulfil", "Source products, compare offers, arrange delivery and keep the purchase or service trail visible."],
  [ShieldCheck, "Check trust & evidence", "Surface verification, availability, evidence and risk before a consequential action is taken."],
  [HeartPulse, "Support everyday wellbeing", "Help with appointments, accessibility, routines and other wellbeing tasks while respecting boundaries."],
  [Mic2, "Use voice & connected context", "Continue through voice, connected services and approved devices when the required connection is available."],
  [Brain, "Remember & continue", "Carry useful preferences, previous decisions, reminders and context forward so you do not have to start again."],
  [CreditCard, "Handle value explicitly", "Keep points separate from money and make paid services, purchases, refunds and payouts visible before they matter."],
  [Zap, "Watch & act proactively", "Monitor for useful changes, alerts, opportunities or follow-ups and bring them to you without silently committing anything."],
] as const;

const highlightedJobs = ["Get a Ride", "Order Food", "Get Suya", "Fix My Phone", "Find a Plumber", "Find a Tutor", "Book a Doctor", "Track a Job", "Source a Product", "Check Rice Prices", "Find a Room", "Book a DJ", "Plan a Move", "Buy Airtime", "Get Flight Alerts", "Find a Photographer", "Find a Lost Pet", "Set a Reminder", "Clear My Inbox", "Control My Smart TV", "Review a Contract", "Organise a Match", "Find Security Personnel", "Find Food Nearby"];

const categoryHighlights = [
  ["Everyday getting things done", ["Transport & mobility", "Food & drink", "Errands & delivery", "Repairs & maintenance", "Personal care"]],
  ["Life, work & money", ["Professional services", "Freelance services", "Gigs & microtasks", "Finance & tax", "Property & real estate"]],
  ["People, community & discovery", ["Education & learning", "Community & neighbourhood", "Language services", "Events & entertainment", "Topics & community"]],
  ["Home, health & safety", ["Health & medical", "Childcare & nanny", "Security & safety", "Digital services", "Government & civic"]],
  ["Travel, sport & culture", ["Tourism & travel", "Sports & viewing", "Fitness & coaching", "Creative arts", "Nightlife & lounges"]],
  ["Shopping, supply & local commerce", ["Classifieds & marketplace", "Agriculture & produce", "Communication & telecom", "Logistics & freight", "Price checking"]],
] as const;

const specialAgentPowers = [
  ["Research & answer", "Turn questions into useful research, summaries, explanations and comparisons before you decide."],
  ["Prepare & review", "Draft messages, documents, contracts, forms, plans and other work for your review."],
  ["Monitor & remind", "Keep watch for changes, deadlines, price movements, travel alerts, follow-ups and reminders."],
  ["Coordinate people", "Find contacts, providers, workers, collaborators or teams and keep the request moving between them."],
  ["Connect to services", "Use approved email, calendar, messaging, storage and connected devices when those connections are available."],
  ["Handle sensitive actions carefully", "Keep identity, trust, confirmation, payment and execution separate so the agent never silently commits on your behalf."],
] as const;

export function AgentsPage() {
  return (
    <div className="space-y-9">
      <PageHeader title="AI agents & assistance" subtitle="Tell Kurukoo the outcome you want. Its agents can combine skills, context and trusted services to help move it forward." />

      <section className="rounded-[24px] border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ce4712]">What can an agent actually do?</p>
            <h2 className="mt-1.5 text-[24px] font-bold tracking-tight">Not just answer questions. Help carry the job.</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Kurukoo's agent layer can combine discovery, verification, communication, scheduling, memory, coordination and execution around the outcome you describe. You do not have to learn agent names or internal skills first.</p>
          </div>
          <Link to="/capabilities" className="inline-flex items-center gap-1 text-[12px] font-medium">See the full capability catalogue <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {agentPowers.map(([Icon, title, detail]) => <div key={title} className="rounded-2xl border border-border bg-background p-4"><Icon className="size-5 text-muted-foreground" strokeWidth={1.8} /><h3 className="mt-3 text-[13.5px] font-semibold">{title}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail}</p></div>)}
        </div>
      </section>

      <section>
        <SectionHeader title="More than the obvious jobs" subtitle="The agent can also help with research, preparation, monitoring, people coordination and connected services." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{specialAgentPowers.map(([title, detail]) => <div key={title} className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-[13.5px] font-semibold">{title}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail}</p></div>)}</div>
      </section>

      <section>
        <SectionHeader title="Things you can ask Kurukoo to help with" subtitle={`${capabilityCount} capability paths sit underneath the conversation.`} />
        <div className="flex flex-wrap gap-2">{highlightedJobs.map((job) => <Link key={job} to="/chat" className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{job}</Link>)}</div>
        <p className="mt-3 text-[10.5px] text-muted-foreground">These are examples, not a fixed command list. Describe the outcome in your own words.</p>
      </section>

      <section>
        <SectionHeader title="Where those skills show up" subtitle="One request can combine several areas instead of forcing you into a single category." />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{categoryHighlights.map(([title, categories]) => <div key={title} className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-[13.5px] font-semibold">{title}</h3><div className="mt-3 flex flex-wrap gap-1.5">{categories.map((category) => <Link key={category} to="/capabilities" className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] text-muted-foreground hover:text-foreground">{category}</Link>)}</div></div>)}</div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4"><SectionHeader title="The skill catalogue behind the agents" subtitle="Users see useful outcomes; the catalogue keeps the underlying jobs discoverable and organised." /><span className="mb-0.5 rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">{skillCategories.length} areas</span></div>
        <div className="space-y-2">{skillCategories.map((category, index) => <details key={category.name} open={index < 3} className="overflow-hidden rounded-2xl border border-border bg-surface"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden"><span><span className="text-[13px] font-semibold">{category.name}</span><span className="ml-2 text-[10.5px] text-muted-foreground">{category.skills.length} skills</span></span><span className="hidden text-[10px] text-muted-foreground sm:inline">{category.surfaces.slice(0, 3).join(" · ")}</span></summary><div className="grid gap-1 border-t border-border/70 bg-background/35 p-3 sm:grid-cols-2 lg:grid-cols-4">{category.skills.map((skill) => <Link key={`${skill.category}-${skill.id}`} to="/chat" className="rounded-xl px-3 py-2.5 hover:bg-elevated"><p className="text-[12px] font-medium">{skill.label}</p><p className="mt-0.5 text-[9.5px] text-muted-foreground">Ask Kurukoo · {skill.surfaces.slice(0, 2).join(" · ")}</p></Link>)}</div></details>)}</div>
      </section>

      <section className="rounded-[24px] bg-foreground p-6 text-background"><div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-center"><div><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-background/60">Control stays with you</p><h2 className="mt-2 text-[22px] font-semibold tracking-tight">Agents can coordinate. You still decide.</h2><p className="mt-2 text-[12px] leading-relaxed text-background/70">Research, discovery, preparation and planning can happen conversationally. Booking, payment, communication, device control and other consequential actions remain visible and approval-gated.</p></div><div className="grid gap-2">{["Discover useful options", "Review evidence and details", "Approve the next action", "Keep the result and context"].map((item, index) => <div key={item} className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5"><span className="grid size-6 place-items-center rounded-full bg-white/15 text-[10px]"><CheckCircle2 className="size-3.5" /></span><span className="text-[11px] text-background/80">{index + 1}. {item}</span></div>)}</div></div><div className="mt-5 flex flex-wrap gap-2"><Link to="/chat"><Action variant="primary">Ask Kurukoo</Action></Link><Link to="/capabilities"><Action>Explore capabilities</Action></Link></div></section>
    </div>
  );
}
