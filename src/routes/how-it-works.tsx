import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Compass,
  FileText,
  MessageCircle,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Workflow,
} from "lucide-react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { VideoCard } from "@/components/kurukoo/cards";
import { actionClass } from "@/components/kurukoo/primitives";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { entityById, videos } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Kurukoo works — everyday AI that gets things done" },
      {
        name: "description",
        content:
          "Learn how Kurukoo turns everyday requests into coordinated work: ask in chat or voice, discover useful options, approve what matters and keep the result connected.",
      },
      { property: "og:title", content: "How Kurukoo works" },
      {
        property: "og:description",
        content: "From a simple request to coordinated work, with you in control.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const lifecycle = [
  [MessageCircle, "Tell Kurukoo", "Start with the outcome. Type it, speak it, or begin from Explore when you already know the kind of job you need done."],
  [Sparkles, "Kurukoo understands", "Kurukoo turns the request into a useful task, keeping the important details together instead of making you repeat yourself."],
  [Search, "Find the right path", "It can use the relevant capability, provider, business, community context or connected source when that path is available."],
  [ShieldCheck, "You review and approve", "Options, evidence, prices, timing and other important decisions are brought back to you before a commitment is made."],
  [Workflow, "The work moves forward", "Once approved, the request becomes connected work. Progress, messages and next steps stay attached to the same job."],
  [Check, "Keep the result", "Completed work can remain in Activity and the relevant history or Memory so the next request can start with useful context."],
] as const;

const entryPoints = [
  {
    icon: MessageCircle,
    title: "Chat",
    body: "The universal control surface. Ask for something, continue an existing request or bring a Topic or discovery result into the conversation.",
    to: "/chat",
    label: "Open Chat",
  },
  {
    icon: Mic,
    title: "Voice",
    body: "When voice is available, speak naturally rather than turning an everyday request into a form. Kurukoo keeps the resulting task connected to the conversation.",
    to: "/chat",
    label: "Start with Chat",
  },
  {
    icon: Compass,
    title: "Explore",
    body: "Start from a goal such as food, groceries, mobility, repairs, work, selling, health, events, community or safety, then hand the actual request to Kurukoo.",
    to: "/explore",
    label: "Explore goals",
  },
  {
    icon: Search,
    title: "Nearby",
    body: "Discover people, places, businesses, offers, events and opportunities around you. Discovery is context; fulfilment still follows the request and evidence flow.",
    to: "/discover",
    label: "See Nearby",
  },
];

const connectionExamples = [
  [FileText, "Connected sources", "When a supported source is connected, Kurukoo can use the authorised information it exposes as part of a request rather than asking you to move the information manually."],
  [MessageCircle, "Messaging and communication", "Supported messaging connections can become an authorised doorway for reaching people after you approve the action."],
  [WalletCards, "Services and accounts", "Connections can give Kurukoo the context needed to coordinate work. The account still controls what is connected and what actions are allowed."],
] as const;

const audiences = [
  ["People", "/people", "Get everyday things done"],
  ["Providers", "/providers", "Turn real capability into work"],
  ["Businesses", "/businesses", "Handle demand and operations"],
  ["Creators", "/creators", "Turn useful recommendations into action"],
  ["Contributors", "/contributors", "Add trusted community knowledge"],
  ["Partners", "/partners", "Connect services to real demand"],
  ["Advertisers", "/advertising", "Reach relevant demand transparently"],
  ["Local agents", "/agents", "Coordinate work with Kurukoo"],
] as const;

function HowItWorksPage() {
  const guide = videos[0];
  const creator = guide ? entityById(guide.creatorId) : null;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-4">
      <header className="max-w-3xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">How Kurukoo works</p>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">
          Tell Kurukoo what needs doing
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Kurukoo is designed around the job you want finished, not around a list of tools you have to learn. Start with a request, let Kurukoo organise the next step, then stay in control of the decisions that matter.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <AskKurukoo prompt="Help me understand how Kurukoo can get something done for me." />
          <Link to="/explore" className={actionClass()}>
            Explore what I can do <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <section aria-labelledby="start-with-outcome" className="space-y-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Start with the outcome</p>
          <h2 id="start-with-outcome" className="mt-1.5 font-serif text-[28px] leading-[1.05] tracking-[-0.035em] md:text-[32px]">Ask for the thing, not the process.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["“Find me a plumber who can come this week.”", "Kurukoo can turn a simple need into a request with the relevant location, timing and provider context."],
            ["“Get three quotes for moving a two-bed flat.”", "Kurukoo can organise a comparison rather than leaving you to repeat the same request to several providers."],
            ["“Plan my day around these appointments.”", "Kurukoo can work from the context you give it and keep the resulting actions together."],
          ].map(([quote, body]) => (
            <article key={quote} className="rounded-[19px] border border-border bg-surface p-4">
              <p className="text-[14px] font-medium leading-relaxed">{quote}</p>
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="kurukoo-lifecycle" className="space-y-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">From request to result</p>
          <h2 id="kurukoo-lifecycle" className="mt-1.5 font-serif text-[28px] leading-[1.05] tracking-[-0.035em] md:text-[32px]">One connected flow</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {lifecycle.map(([Icon, title, body], index) => (
            <article key={title} className="rounded-[19px] border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-elevated"><Icon className="size-4" /></span>
                <span className="text-[10px] font-semibold text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-[14.5px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="ways-to-start" className="space-y-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ways to use it</p>
          <h2 id="ways-to-start" className="mt-1.5 font-serif text-[28px] leading-[1.05] tracking-[-0.035em] md:text-[32px]">Start wherever the job makes sense</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {entryPoints.map(({ icon: Icon, title, body, to, label }) => (
            <article key={title} className="rounded-[19px] border border-border bg-surface p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Icon className="size-4" /></span>
              <h3 className="mt-4 text-[14.5px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
              <Link to={to} className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium hover:underline">
                {label} <ArrowRight className="size-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="connections" className="rounded-[22px] border border-border bg-elevated/35 p-5 md:p-6">
        <div className="max-w-3xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Connect what you already use</p>
          <h2 id="connections" className="mt-1.5 font-serif text-[28px] leading-[1.05] tracking-[-0.035em] md:text-[32px]">Connections are part of the flow, not another app to learn.</h2>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            Connect is the place for authorised sources and services. Where a connection is actually available for your account, Kurukoo can use the permissions you grant. Examples people may expect from this layer include Google Drive, WhatsApp and external AI assistants such as Grok, ChatGPT, Claude or Gemini; the frontend only treats a connection as live when the underlying service supports it and the account has authorised it.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {connectionExamples.map(([Icon, title, body]) => (
            <div key={title} className="rounded-[17px] border border-border bg-surface p-4">
              <Icon className="size-4 text-primary" />
              <h3 className="mt-3 text-[13.5px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/connect" className={actionClass("primary")}>See Connect <ArrowRight className="size-3.5" /></Link>
          <Link to="/resources" className={actionClass()}>Read visual guides</Link>
        </div>
      </section>

      <section aria-labelledby="after-approval" className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[22px] border border-border bg-surface p-5 md:p-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">After you say yes</p>
          <h2 id="after-approval" className="mt-1.5 font-serif text-[27px] leading-[1.05] tracking-[-0.035em]">The request becomes work.</h2>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">Supported requests can move into Work, where progress, requirements, commercial steps, messages and outcomes stay connected. Activity keeps the important updates visible without making you hunt through old conversations.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/work" className={actionClass()}>Open Work</Link>
            <Link to="/activity" className={actionClass()}>See Activity</Link>
          </div>
        </div>
        <div className="rounded-[22px] border border-border bg-surface p-5 md:p-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your context stays useful</p>
          <h2 className="mt-1.5 font-serif text-[27px] leading-[1.05] tracking-[-0.035em]">Less repeating. More continuity.</h2>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">When the relevant system supports it, completed conversations, requests and approved context can remain connected so future work can start with what is already known.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/memory" className={actionClass()}>Open Memory</Link>
            <Link to="/chat" className={actionClass()}>Continue in Chat</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="audiences" className="space-y-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">For different kinds of users</p>
          <h2 id="audiences" className="mt-1.5 font-serif text-[28px] leading-[1.05] tracking-[-0.035em] md:text-[32px]">The same operating model, different outcomes</h2>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">How Kurukoo is used changes with the person or organisation. These pages show the relevant jobs, tools and next steps without duplicating the universal flow above.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(([label, to, body]) => (
            <Link key={label} to={to} className="group rounded-[17px] border border-border bg-surface p-4 hover:bg-elevated">
              <p className="text-[13px] font-semibold">{label}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
              <ArrowRight className="mt-3 size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {guide && creator ? (
        <section className="grid gap-5 rounded-[22px] border border-border bg-surface p-5 md:grid-cols-[1.15fr_.85fr] md:items-center">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Watch</p>
            <h2 className="mt-1.5 font-serif text-[27px] leading-[1.05] tracking-[-0.035em]">See a visual guide</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">Prefer to watch the flow? Kurukoo can explain a task visually as well as through text.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/resources" className={actionClass("primary")}>Browse Resources <ArrowRight className="size-3.5" /></Link>
              <Link to="/chat" className={actionClass()}>Try Kurukoo</Link>
            </div>
          </div>
          <VideoCard video={guide} creatorName={creator.name} />
        </section>
      ) : null}

      <FAQSection
        items={[
          {
            question: "Is Kurukoo just a chatbot?",
            answer: "No. Chat is the universal control surface, but the product is designed to turn requests into connected discovery, approval, execution and follow-up rather than stopping at a conversation.",
          },
          {
            question: "Do I stay in control?",
            answer: "Yes. Kurukoo can organise work and surface options, but important commitments and approvals remain yours. The product should not claim that an action happened when the underlying system has not confirmed it.",
          },
          {
            question: "Does Kurukoo work with real providers and businesses?",
            answer: "Where the backend has an eligible provider, business or other source with the required evidence, Kurukoo can use it in a supported request. Discovery and community information are not automatically treated as fulfilment proof.",
          },
          {
            question: "Can I use voice?",
            answer: "Voice is part of the Kurukoo experience where the voice path is enabled. The goal is the same: speak naturally, let Kurukoo organise the request, then continue through the same work and approval flow.",
          },
          {
            question: "What happens if a connection is not available?",
            answer: "Kurukoo should say so rather than pretending it is connected. You can still use Chat, Explore and the other available paths, while Connect shows the services and resources that can actually be authorised for your account.",
          },
        ]}
      />
    </div>
  );
}
