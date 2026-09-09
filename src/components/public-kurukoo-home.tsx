import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  Heart,
  MessageCircle,
  Mic,
  Mic2,
  BriefcaseBusiness,
  Network,
  Megaphone,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { KURUKOO_PUBLIC_ROLES } from "@/lib/kurukoo-personas";

const examples = [
  ["I need a reliable electrician tomorrow", "Find a suitable local provider for the job and timing.", "Local help"],
  ["Help me prepare for my client call", "Bring together the context and preparation you need before the call.", "Work"],
  ["Find somewhere good for dinner nearby", "Explore nearby places and choose one that fits.", "Nearby"],
  ["Remind me to follow up with the client Friday", "Keep the follow-up on your radar for the right day.", "Remember"],
  ["What opportunities are opening up around me?", "See relevant possibilities and decide which ones are worth pursuing.", "Opportunities"],
  ["Save this place and remember why I liked it", "Keep the place and useful context together for later.", "Memory"],
] as const;

const prompts = [
  "Find a trusted provider",
  "Help me plan my day",
  "Show me opportunities",
  "Remember this for later",
  "What’s happening nearby",
  "Help me get this done",
  "Get a Ride",
  "Order Food",
  "Sell an item",
] as const;

const publicRoleIcons = {
  seeker: Users,
  provider: Target,
  business: Network,
  creator: Sparkles,
  contributor: Users,
  partner: Network,
  advertiser: Megaphone,
  "local-agent": Zap,
} as const;

const whoServes = KURUKOO_PUBLIC_ROLES.map((role) => [
  publicRoleIcons[role.id],
  role.title,
  role.description,
  role.to,
  role.cta,
] as const);

const entryPoints = [
  [MessageCircle, "Chat", "Ask for something, continue a request or bring useful context into the conversation.", "/chat", "Open Chat"],
  [Compass, "Explore", "Start from a goal such as food, mobility, repairs, work, selling, health, events or safety.", "/explore", "Explore goals"],
  [Target, "Nearby", "See useful people, places, businesses, offers, events and opportunities around you.", "/discover", "See Nearby"],
  [Users, "Community", "Follow local discussion and context, then take useful questions back to Kurukoo when needed.", "/topics", "Open Community"],
] as const;

const coreWorkflow = [
  [MessageCircle, "Conversation", "Where you start: ask, continue a thread or bring context into the conversation."],
  [ClipboardList, "Request", "The outcome becomes a clear request with the relevant details, options and decisions kept together."],
  [BriefcaseBusiness, "Work", "Once a request moves forward, progress, requirements, messages and the outcome stay connected."],
] as const;

const supportedChannels = [
  ["WhatsApp", "whatsapp"], ["Telegram", "telegram"], ["Google Drive", "googledrive"], ["Google Sheets", "googlesheets"],
  ["Notion", "notion"], ["ChatGPT", "openai"], ["Claude", "anthropic"], ["Gemini", "googlegemini"],
  ["Grok", "grok"], ["Copilot", "microsoftcopilot"], ["Dola", "dola"], ["Outlook", "microsoftoutlook"],
  ["OneDrive", "onedrive"], ["Google Calendar", "googlecalendar"],
] as const;

const capabilities = [
  [Sparkles, "Conversation", "Start with what you need. Kurukoo turns plain language into useful next steps."],
  [Target, "Requests & Work", "Keep the request alive from first ask through coordination and completion."],
  [Network, "Explore & Network", "Discover people, places, services, ideas and opportunities in context."],
  [ShieldCheck, "Trust", "Provider information, verification and commitments are evidence- and consent-gated."],
  [Zap, "Activity & Reminders", "See what is moving, what needs attention and where proactive help can open up."],
  [Heart, "Memory & Saved", "Keep useful context so Kurukoo can become more helpful over time."],
  [Users, "Topics & Opportunities", "Connect with people, conversations and possibilities around you."],
  [Wallet, "Wallet, Points & Plans", "Handle value, rewards and access as part of the same experience."],
  [Mic2, "Voice & Context", "Talk naturally and bring trusted context into the moment, including through QR experiences."],
] as const;

export function PublicHome({ onSend }: { onSend?: (message: string) => void }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    const exampleTimer = window.setInterval(
      () => setExampleIndex((value) => (value + 1) % examples.length),
      4800,
    );
    const promptTimer = window.setInterval(
      () => setPromptIndex((value) => (value + 1) % prompts.length),
      6200,
    );
    return () => {
      window.clearInterval(exampleTimer);
      window.clearInterval(promptTimer);
    };
  }, []);

  const shufflePrompts = () => {
    if (prompts.length < 2) return;
    let next = promptIndex;
    while (next === promptIndex) next = Math.floor(Math.random() * prompts.length);
    setPromptIndex(next);
  };

  const sendPrompt = (prompt: string) => {
    onSend?.(prompt);
    window.location.href = "/chat";
  };

  return (
    <div className="w-full pb-8">
      <section className="relative pb-10 md:pb-12">
        <div className="pointer-events-none absolute -right-32 -top-28 size-[440px] rounded-full bg-brand-tint/65 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[30%] size-48 rounded-full bg-brand-tint/25 blur-3xl" />
        <div className="relative max-w-[900px]">
          <p className="mb-3 text-[13px] font-medium text-primary">Your everyday, moving forward.</p>
          <h1 className="max-w-[820px] font-serif text-[40px] leading-[1.02] tracking-[-0.045em] text-foreground md:text-[52px]">
            <span className="block">Tell Kurukoo</span>
            <span className="block">what needs doing</span>
          </h1>
          <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-muted-foreground">
            Say what you need in plain language. Kurukoo helps you find a useful way forward.
          </p>
          <div className="mt-7 max-w-[900px]">
            <Composer onSend={onSend ?? (() => undefined)} placeholder="What needs your attention?" />
          </div>
          <div className="mt-3 flex w-full min-w-0 items-center gap-2" aria-label="Try Kurukoo prompts">
            <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-2 pr-1">
                {Array.from({ length: Math.min(6, prompts.length) }, (_, offset) => {
                  const prompt = prompts[(promptIndex + offset) % prompts.length] ?? prompts[0];
                  return (
                    <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background/75 px-3 py-1.5 text-[10.5px] font-medium transition-colors hover:bg-brand-tint/30">
                      {prompt}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={shufflePrompts} aria-label="Shuffle suggested prompts" title="Shuffle suggested prompts" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background/75 transition-colors hover:bg-brand-tint/30">
              <Shuffle className="size-4" strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 py-9 md:py-11">
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(245px,.72fr)_minmax(0,1.8fr)] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Who Kurukoo serves</p>
            <h2 className="mt-1.5 text-[24px] font-bold tracking-tight text-foreground">One network, many ways to participate.</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">People who need something, people who provide it, businesses and creators, contributors and partners, advertisers and local agents.</p>
          </div>
          <div className="min-w-0 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Who Kurukoo serves">
            <div className="flex w-max min-w-full gap-3">
              {whoServes.map(([Icon, title, detail, to, label]) => {
                const C = Icon as typeof Users;
                return (
                  <Link key={title as string} to={to as never} className="group flex min-h-[205px] w-[205px] shrink-0 flex-col rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated/55">
                    <C className="size-5 text-primary" strokeWidth={1.7} />
                    <h3 className="mt-3 text-[14px] font-semibold">{title as string}</h3>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail as string}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[10.5px] font-medium">{label as string}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 py-9 md:py-11" aria-labelledby="entry-points-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Ways into Kurukoo</p>
            <h2 id="entry-points-title" className="mt-1.5 text-[24px] font-bold tracking-tight">Start where the job makes sense.</h2>
          </div>
          <Link to="/explore" className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground sm:inline-flex">Explore all <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {entryPoints.map(([Icon, title, detail, to, label]) => {
            const C = Icon as typeof Sparkles;
            return <Link key={title as string} to={to as never} className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated/55"><C className="size-5 text-primary" strokeWidth={1.7} /><h3 className="mt-3 text-[13.5px] font-semibold">{title as string}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail as string}</p><span className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">{label as string} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>;
          })}
        </div>
      </section>

      <section className="border-t border-border/70 py-9 md:py-11">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Real examples</p><h2 className="mt-1.5 text-[24px] font-bold tracking-tight">Try Kurukoo with something real.</h2></div>
          <div className="flex items-center gap-1"><button type="button" onClick={() => setExampleIndex((v) => (v - 1 + examples.length) % examples.length)} aria-label="Previous example" className="grid size-8 place-items-center rounded-full border border-border hover:bg-elevated"><ChevronLeft className="size-4" /></button><button type="button" onClick={() => setExampleIndex((v) => (v + 1) % examples.length)} aria-label="Next example" className="grid size-8 place-items-center rounded-full border border-border hover:bg-elevated"><ChevronRight className="size-4" /></button></div>
        </div>
        <div className="mt-5 overflow-hidden"><div className="flex gap-3 transition-transform duration-500" style={{ transform: `translateX(-${exampleIndex * 33.333}%)` }}>{examples.map(([ask, result, meta]) => <Link key={ask} to="/chat" className="min-w-[86%] rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-elevated sm:min-w-[62%] md:min-w-[32%]"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink"><MessageCircle className="size-4" /></span><div><p className="text-[13px] font-medium leading-snug">“{ask}”</p><p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{result}</p><p className="mt-3 text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{meta}</p></div></div></Link>)}</div></div>
      </section>

      <section className="border-t border-border/70 py-9 md:py-11" aria-labelledby="core-workflow-title">
        <div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">The Kurukoo workflow</p><h2 id="core-workflow-title" className="mt-1.5 font-serif text-[28px] leading-tight tracking-[-0.035em]">Conversation → Request → Work, with Voice wherever it fits.</h2><p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">The core surfaces are connected. You can enter at different points, but when something becomes a request, Kurukoo keeps the same piece of work moving through the right surface.</p></div>
        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)_28px_minmax(0,1fr)] lg:items-stretch">
          {coreWorkflow.map(([Icon, title, body], index) => { const C = Icon as typeof MessageCircle; return <div key={title} className="contents"><Link to="/how-it-works" className="group rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-elevated/55"><div className="flex items-center justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl bg-brand-tint text-brand-ink"><C className="size-4" strokeWidth={1.8} /></span><span className="text-[10px] font-semibold text-muted-foreground">0{index + 1}</span></div><h3 className="mt-4 text-[14px] font-semibold">{title}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p><span className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium">Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>{index < 2 ? <div aria-hidden className="hidden items-center justify-center lg:flex"><ArrowRight className="size-4 text-muted-foreground/60" /></div> : null}</div>; })}
        </div>
        <Link to="/how-it-works" className="mt-3 flex items-center gap-3 rounded-[18px] border border-dashed border-border bg-elevated/30 px-4 py-3 transition-colors hover:bg-elevated/55"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Mic className="size-4" strokeWidth={1.8} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">Voice can enter the same conversation</p><p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">Where voice is available, speak naturally and continue into the same Kurukoo workflow rather than starting a separate process.</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>
      </section>

      <section className="border-t border-border/70 py-4 md:py-5" aria-labelledby="supported-channels-title">
        <div className="grid min-h-[64px] min-w-0 items-center gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
          <div className="min-w-0"><p id="supported-channels-title" className="text-[12px] font-semibold tracking-tight text-foreground">Supported channels</p><p className="mt-0.5 text-[10.5px] text-muted-foreground">Bring the tools you already use.</p></div>
          <div className="relative min-w-0 overflow-hidden" aria-label="Supported channels and integrations"><div className="kurukoo-channel-marquee flex w-max items-center gap-2.5 hover:[animation-play-state:paused]">
            {[...supportedChannels, ...supportedChannels].map(([name, slug], index) => <span key={`${slug}-${index}`} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-[11.5px] font-medium text-foreground"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-elevated"><img src={`https://cdn.simpleicons.org/${slug}`} alt="" aria-hidden="true" width="15" height="15" loading="lazy" className="size-[15px] object-contain opacity-80" /></span>{name}</span>)}
          </div></div>
        </div>
      </section>

      <section className="border-y border-border/70 py-9 md:py-11">
        <div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">One OS, many moments</p><h2 className="mt-1.5 text-[24px] font-bold tracking-tight">Ask, organise, coordinate or discover.</h2><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Conversation is the entry point. Requests, discovery, trust, work, activity, memory and coordination are the continuity underneath.</p><p className="mt-3 text-[14px] font-medium tracking-tight text-foreground">Everything useful stays connected.</p></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon, title, detail]) => { const C = Icon as typeof Sparkles; return <div key={title as string} className="rounded-2xl border border-border bg-surface p-4"><C className="size-5 text-primary" strokeWidth={1.7} /><h3 className="mt-3 text-[13.5px] font-semibold">{title as string}</h3><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{detail as string}</p></div>; })}</div>
      </section>

      <section className="border-t border-border/70 pt-9 md:pt-11">
        <div className="rounded-3xl border border-border bg-surface p-6 md:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Ready when you are</p><h2 className="mt-1.5 text-[24px] font-bold tracking-tight">Tell Kurukoo what needs doing.</h2><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Start with one thing. You can always ask for the next.</p></div><Link to="/explore" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-semibold text-primary-foreground">Explore Kurukoo <ArrowRight className="size-4" /></Link></div></div>
      </section>
    </div>
  );
}
