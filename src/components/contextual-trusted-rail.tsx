import { useRouterState, Link } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  Brain,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  FolderClosed,
  MessageSquare,
  MapPin,
  Sparkles,
  Tags,
  Target,
  Wallet,
  Zap,
  Users,
  Plug,
} from "lucide-react";
import { useEffect, useState, type ReactNode, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useKurukoo } from "@/lib/kurukoo-store";
import { fetchCommunityStats, type CommunityStats } from "@/lib/community-topics-api";
import {
  activatePulse,
  deactivatePulse,
  fetchAuthenticatedAd,
  fetchPulseReadiness,
  type AuthenticatedAd,
  type PulseReadiness,
} from "@/lib/kurukoo-api";

type Icon = ComponentType<{ className?: string }>;
function Section({
  title,
  icon: Icon,
  to,
  children,
}: {
  title: string;
  icon: Icon;
  to: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-[12.5px] font-semibold">{title}</h2>
        </div>
        <Link to={to as never} className="text-[10px] text-muted-foreground hover:text-foreground">
          Open
        </Link>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
function Row({
  icon: Icon,
  title,
  detail,
  to,
  live = false,
}: {
  icon: Icon;
  title: string;
  detail: string;
  to?: string;
  live?: boolean;
}) {
  const row = (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5">
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full",
          live ? "bg-brand-tint text-brand-ink" : "bg-elevated text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11.5px] font-medium">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
  return to ? (
    <Link to={to as never} className="block rounded-xl hover:bg-elevated">
      {row}
    </Link>
  ) : (
    row
  );
}
function RailAd({ campaign }: { campaign: AuthenticatedAd | null }) {
  if (!campaign) return null;
  return (
    <a
      href={campaign.clickUrl}
      className="mt-auto block overflow-hidden rounded-2xl border border-border bg-elevated/55 hover:bg-elevated"
      rel="nofollow"
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {campaign.disclosure}
          </p>
          <ExternalLink className="size-3 text-muted-foreground" />
        </div>
        {campaign.image ? (
          <img
            src={campaign.image}
            alt=""
            loading="lazy"
            width="176"
            height="78"
            className="mt-2 h-16 w-full rounded-xl object-cover"
          />
        ) : null}
        <p className="mt-2 text-[11.5px] font-semibold leading-4">{campaign.title}</p>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{campaign.desc}</p>
        <span className="mt-2 inline-flex text-[10.5px] font-medium">{campaign.ctaText}</span>
      </div>
    </a>
  );
}
function CommunityStatsSection({ stats }: { stats: CommunityStats | null }) {
  const members = stats?.members ?? 1;
  const online = stats?.online ?? 1;
  const guests = stats?.guests ?? 1;
  return (
    <section className="rounded-2xl bg-elevated/25 p-3" aria-label="Community statistics">
      <div className="flex items-center gap-2"><Users className="size-3.5 text-primary"/><h2 className="text-[12.5px] font-semibold">Community</h2></div>
      <div className="mt-2 grid grid-cols-3 items-end gap-2">
        <div><p className="text-[9px] text-muted-foreground">Members</p><p className="mt-0.5 text-[13px] font-semibold tabular-nums">{members}</p></div>
        <div><p className="text-[9px] text-muted-foreground">Online</p><p className="mt-0.5 text-[13px] font-semibold tabular-nums">{online}</p></div>
        <div><p className="text-[9px] text-muted-foreground">Guests</p><p className="mt-0.5 text-[13px] font-semibold tabular-nums">{guests}</p></div>
      </div>
    </section>
  );
}
function PulseControl({
  readiness,
  onChange,
}: {
  readiness: PulseReadiness | null;
  onChange: (value: PulseReadiness) => void;
}) {
  const [skill, setSkill] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const can = Boolean(readiness?.eligibleToBroadcast);
  async function goLive() {
    if (!can) return;
    if (!skill.trim()) {
      setMessage("Tell Kurukoo what you are available for.");
      return;
    }
    if (!navigator.geolocation) {
      setMessage("Location is required before Go Live.");
      return;
    }
    setBusy(true);
    setMessage("Requesting your location…");
    try {
      const p = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 30000,
          timeout: 10000,
        }),
      );
      await activatePulse(skill.trim(), p.coords.latitude, p.coords.longitude);
      const next = await fetchPulseReadiness();
      onChange(next);
      window.dispatchEvent(new Event("kurukoo-pulse-updated"));
      setMessage("You are live on Nearby Pulse.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Nearby Pulse.");
    } finally {
      setBusy(false);
    }
  }
  async function stop() {
    setBusy(true);
    try {
      await deactivatePulse();
      const next = await fetchPulseReadiness();
      onChange(next);
      window.dispatchEvent(new Event("kurukoo-pulse-updated"));
      setMessage("Nearby Pulse is off.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to stop Nearby Pulse");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl bg-elevated/50 p-2.5">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 grid size-7 place-items-center rounded-full",
            readiness?.active ? "bg-brand-tint text-brand-ink" : "bg-surface text-muted-foreground",
          )}
        >
          <Zap className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-medium">
            {readiness?.active ? "Live on Nearby Pulse" : "Your availability"}
          </p>
          <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
            {readiness?.active
              ? "Nearby people can discover your available service."
              : can
                ? "Choose when to let nearby people discover you."
                : "Go Live becomes available after provider readiness is complete."}
          </p>
        </div>
      </div>
      {readiness?.active ? (
        <button
          type="button"
          onClick={() => void stop()}
          disabled={busy}
          className="mt-2.5 min-h-8 w-full rounded-lg border border-border px-2.5 text-[10.5px] font-medium hover:bg-background disabled:opacity-50"
        >
          {busy ? "Stopping…" : "Stop Go Live"}
        </button>
      ) : (
        <>
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            disabled={!can || busy}
            placeholder={can ? "e.g. oranges, suya, delivery" : "Provider skill"}
            className="mt-2.5 min-h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10.5px] outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void goLive()}
            disabled={!can || busy}
            className="mt-1.5 min-h-8 w-full rounded-lg bg-primary px-2.5 text-[10.5px] font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Starting…" : "Go Live"}
          </button>
        </>
      )}
      <p className="mt-1.5 text-[9.5px] leading-4 text-muted-foreground" aria-live="polite">
        {message || readiness?.nudge}
      </p>
    </div>
  );
}
export function ContextualTrustedRail({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { work, memory, notifications } = useKurukoo();
  const [readiness, setReadiness] = useState<PulseReadiness | null>(null);
  const [ad, setAd] = useState<AuthenticatedAd | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<"calm" | "clear" | "warm">("calm");
  const [voiceLanguage, setVoiceLanguage] = useState("en-GB");
  const focus = work.find((item) => item.stage !== "done");
  const unread = notifications.filter((item) => !item.read).length;
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void fetchPulseReadiness()
        .then((v) => {
          if (!cancelled) setReadiness(v);
        })
        .catch(() => {
          if (!cancelled) setReadiness(null);
        });
    load();
    const onPulse = () => load();
    window.addEventListener("kurukoo-pulse-updated", onPulse);
    const id = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener("kurukoo-pulse-updated", onPulse);
      window.clearInterval(id);
    };
  }, []);
  useEffect(() => {
    const onVoice = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean; style?: string; language?: string }>).detail || {};
      setVoiceOpen(Boolean(detail.open));
      if (detail.style === "calm" || detail.style === "clear" || detail.style === "warm") setVoiceStyle(detail.style);
      if (typeof detail.language === "string" && detail.language) setVoiceLanguage(detail.language);
    };
    window.addEventListener("kurukoo-voice-state", onVoice);
    const stored = localStorage.getItem("kurukoo-voice-preferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.style === "calm" || parsed.style === "clear" || parsed.style === "warm") setVoiceStyle(parsed.style);
        if (typeof parsed.language === "string" && parsed.language) setVoiceLanguage(parsed.language);
      } catch { /* keep defaults */ }
    }
    setVoiceOpen(localStorage.getItem("kurukoo-voice-open") === "1");
    return () => window.removeEventListener("kurukoo-voice-state", onVoice);
  }, []);

  function saveVoicePreferences(nextStyle = voiceStyle, nextLanguage = voiceLanguage) {
    localStorage.setItem("kurukoo-voice-preferences", JSON.stringify({ style: nextStyle, language: nextLanguage }));
    window.dispatchEvent(new CustomEvent("kurukoo-voice-preferences", { detail: { style: nextStyle, language: nextLanguage } }));
  }
  useEffect(() => { void fetchCommunityStats().then(setCommunityStats).catch(() => undefined); }, []);
  useEffect(() => {
    if (!open) return;
    void fetchAuthenticatedAd("context-rail")
      .then(setAd)
      .catch(() => setAd(null));
  }, [open, pathname]);
  const live = Boolean(readiness?.active);
  const workRow = focus ? (
    <Row
      icon={Target}
      title={focus.title}
      detail={focus.stage === "needs_you" ? "Needs you" : "In progress"}
      to={"/work/" + focus.id}
    />
  ) : (
    <p className="px-1.5 py-2 text-[10px] text-muted-foreground">Nothing in motion.</p>
  );
  const defaultContent = (
    <>
      <Section title="Trusted context" icon={Brain} to="/memory">
        <Row icon={Sparkles} title="For You" detail="Personal operating view" to="/you" />
        <Row icon={Briefcase} title="Current work" detail={focus?.title ?? "No active work"} to="/work" />
        <Row icon={Brain} title={memory.length ? "Active memory" : "Memory ready"} detail="Private continuity" to="/memory" />
      </Section>
      <Section title="Your availability" icon={MapPin} to="/discover">
        <PulseControl readiness={readiness} onChange={setReadiness} />
      </Section>
      <Section title="Places & nearby" icon={MapPin} to="/discover">
        <Row icon={MapPin} title="Nearby" detail="People, places, offers and live activity" />
        <Row icon={Zap} title="Radar" detail={live ? "Your Pulse is live" : "Local attention layer"} live />
      </Section>
      <Section title="Attention" icon={Bell} to="/activity">
        <Row icon={Bell} title={unread ? `${unread} unread` : "Caught up"} detail="What needs your attention" />
      </Section>
      {ad ? <RailAd campaign={ad} /> : null}
    </>
  );
  const nearbyContent = (
    <>
      <Section title="Your availability" icon={MapPin} to="/discover"><PulseControl readiness={readiness} onChange={setReadiness} /></Section>
      <Section title="Local world" icon={Compass} to="/discover"><Row icon={MapPin} title="Nearby" detail="Live and stationary discovery" /><Row icon={Tags} title="Offers & Daily Picks" detail="Relevant commercial discovery" /></Section>
      <Section title="Your work" icon={Briefcase} to="/work">{workRow}</Section>
      {ad ? <RailAd campaign={ad} /> : null}
    </>
  );
  const topicsContent = (
    <>
      <CommunityStatsSection stats={communityStats} />
      <Section title="Topic context" icon={Tags} to="/topics"><Row icon={Tags} title="Community discussion" detail="Context, not fulfilment proof" /><Row icon={MapPin} title="Nearby" detail="Local businesses and activity" to="/discover" /></Section>
      <Section title="Opportunities" icon={Target} to="/opportunities"><Row icon={Sparkles} title="Ways to participate" detail="Useful network signals" /></Section>
      {ad ? <RailAd campaign={ad} /> : null}
    </>
  );
  const workContent = (
    <>
      <Section title="Current work" icon={Briefcase} to="/work">{workRow}</Section>
      <Section title="Availability" icon={MapPin} to="/discover"><PulseControl readiness={readiness} onChange={setReadiness} /></Section>
      <Section title="Messages & attention" icon={MessageSquare} to="/messages"><Row icon={Bell} title={unread ? `${unread} unread` : "Caught up"} detail="Notifications and conversations" /></Section>
      {ad ? <RailAd campaign={ad} /> : null}
    </>
  );
  const businessContent = (
    <>
      <Section title="Your business" icon={Briefcase} to="/businesses"><Row icon={StoreIcon} title="Products & offers" detail="What people can discover" /><Row icon={MapPin} title={live ? "Live nearby" : "Availability"} detail={live ? "People can discover you" : "Go Live when ready"} to="/discover" /></Section>
      <Section title="Your work" icon={Briefcase} to="/work">{workRow}</Section>
      {ad ? <RailAd campaign={ad} /> : null}
    </>
  );
  let content = defaultContent;
  if (pathname.startsWith("/discover")) content = nearbyContent;
  else if (pathname.startsWith("/topics")) content = topicsContent;
  else if (pathname.startsWith("/work")) content = workContent;
  else if (pathname.startsWith("/businesses") || pathname.startsWith("/providers")) content = businessContent;
  const compact = [
    { label: "For You", to: "/you", Icon: Sparkles },
    { label: "Nearby Radar", to: "/discover", Icon: MapPin },
    { label: "Availability", to: "/discover", Icon: Zap },
    { label: "Current work", to: "/work", Icon: Briefcase },
    { label: "Memory", to: "/memory", Icon: Brain },
    { label: "Attention", to: "/activity", Icon: Bell },
    { label: "Topics", to: "/topics", Icon: Tags },
    { label: "Opportunities", to: "/opportunities", Icon: Target },
    { label: "Explore", to: "/explore", Icon: Compass },
    { label: "Messages", to: "/messages", Icon: MessageSquare },
    { label: "Wallet", to: "/wallet", Icon: Wallet },
  ];
  return (
    <aside aria-label="Trusted context rail" className={cn("relative min-h-0 h-full hidden overflow-hidden border-l border-border bg-surface py-4 lg:flex lg:flex-col", open ? "w-[224px] px-3" : "w-[48px] px-1.5")}>
      <button type="button" onClick={() => onOpenChange(!open)} aria-label={open ? "Close trusted context" : "Open trusted context"} title={open ? "Close trusted context" : "Open trusted context"} className="absolute left-0 top-5 z-20 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-elevated">
        {open ? <ChevronRight className="size-[17px]" /> : <ChevronLeft className="size-[17px]" />}
      </button>
      {open ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2">
          <nav aria-label="Quick context links" className="grid grid-cols-4 gap-1.5 rounded-2xl border border-border bg-background/60 p-1.5">
            <Link to="/messages" aria-label="Messages" title="Messages" className="grid h-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground"><MessageSquare className="size-4" /></Link>
            <Link to="/contacts" aria-label="Contacts" title="Contacts" className="grid h-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground"><Users className="size-4" /></Link>
            <Link to="/connect" aria-label="Connect" title="Connect" className="grid h-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground"><Plug className="size-4" /></Link>
            <Link to="/artifacts" aria-label="Files" title="Files" className="grid h-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground"><FolderClosed className="size-4" /></Link>
          </nav>
          {voiceOpen ? (
            <Section title="Voice conversation" icon={Sparkles} to="/chat">
              <div className="rounded-xl bg-brand-tint/25 p-2.5"><p className="text-[10px] leading-4 text-muted-foreground">These choices control how the current browser voice session listens and speaks.</p>
                <label className="mt-2 block text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Voice style
                  <select value={voiceStyle} onChange={(e) => { const next=e.target.value as "calm"|"clear"|"warm"; setVoiceStyle(next); saveVoicePreferences(next, voiceLanguage); }} className="mt-1 min-h-8 w-full rounded-lg border border-border bg-background px-2 text-[10.5px] font-medium outline-none"><option value="calm">Calm</option><option value="clear">Clear</option><option value="warm">Warm</option></select>
                </label>
                <label className="mt-2 block text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Conversation language
                  <select value={voiceLanguage} onChange={(e) => { const next=e.target.value; setVoiceLanguage(next); saveVoicePreferences(voiceStyle, next); }} className="mt-1 min-h-8 w-full rounded-lg border border-border bg-background px-2 text-[10.5px] font-medium outline-none"><option value="en-GB">English (UK)</option><option value="en-NG">English (Nigeria)</option><option value="en-US">English (US)</option><option value="ha-NG">Hausa</option><option value="yo-NG">Yorùbá</option><option value="ig-NG">Igbo</option><option value="pcm-NG">Nigerian Pidgin</option></select>
                </label><p className="mt-2 text-[9px] leading-4 text-muted-foreground">Voice sessions stay on the same Kurukoo conversation. Close voice to return to Chat.</p>
              </div>
            </Section>
          ) : null}
          {content}
        </div>
      ) : (
        <nav aria-label="Trusted context shortcuts" className="mt-10 flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain py-1">
          <div className="mb-2 grid grid-cols-2 gap-1">
            <Link to="/messages" aria-label="Messages" title="Messages" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated"><MessageSquare className="size-4" /></Link>
            <Link to="/contacts" aria-label="Contacts" title="Contacts" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated"><Users className="size-4" /></Link>
            <Link to="/connect" aria-label="Connect" title="Connect" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated"><Plug className="size-4" /></Link>
            <Link to="/artifacts" aria-label="Files" title="Files" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated"><FolderClosed className="size-4" /></Link>
          </div>
          {compact.map(({ label, to, Icon }) => (
            <Link key={label} to={to as never} aria-label={label} title={label} className={cn("grid size-9 shrink-0 place-items-center rounded-xl", pathname.startsWith(to) ? "bg-elevated text-foreground" : "text-muted-foreground hover:bg-elevated")}><Icon className="size-[17px]" /></Link>
          ))}
        </nav>
      )}
    </aside>
  );
}
function StoreIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M4 10v9h16v-9" /><path d="M3 10l2-6h14l2 6" /><path d="M8 10v9M16 10v9" />
    </svg>
  );
}
