import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, CircleAlert, Clock3, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Composer } from "@/components/kurukoo/composer";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { useKurukoo } from "@/lib/kurukoo-store";
import { fetchEconomicRequests, fetchPulseReadiness, isKurukooApiConfigured, type EconomicRequest, type PulseReadiness } from "@/lib/kurukoo-api";
import { canonicalWorkItem } from "@/lib/work-projection";

const terminalStatuses = new Set(["completed", "cancelled", "abandoned", "disputed", "failed"]);
const attentionStatuses = new Set(["awaiting_approval", "awaiting_payment", "awaiting_confirmation"]);

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function FieldCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`field-card ${className}`}>{children}</section>;
}

function CardHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="field-card-heading"><div>{eyebrow ? <p className="field-eyebrow">{eyebrow}</p> : null}<h2>{title}</h2></div>{action}</div>;
}

function StatusBadge({ children, tone = "peach" }: { children: ReactNode; tone?: "peach" | "green" | "gold" }) {
  return <span className={`field-status field-status-${tone}`}>{children}</span>;
}

export function FieldDashboard() {
  const { work: localWork, notifications, send } = useKurukoo();
  const configured = isKurukooApiConfigured();
  const [requests, setRequests] = useState<EconomicRequest[]>([]);
  const [pulse, setPulse] = useState<PulseReadiness | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");
  const now = new Date();
  const unread = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [next, readiness] = await Promise.all([fetchEconomicRequests(), fetchPulseReadiness()]);
        if (!cancelled) { setRequests(next); setPulse(readiness); setError(""); }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Your live Field could not be refreshed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [configured]);

  const active = useMemo(() => configured
    ? requests.filter((request) => !terminalStatuses.has(request.status)).map(canonicalWorkItem).slice(0, 5)
    : localWork.filter((item) => item.stage !== "done").slice(0, 5), [configured, localWork, requests]);
  const needsYou = useMemo(() => configured
    ? requests.filter((request) => attentionStatuses.has(request.status))
    : localWork.filter((item) => item.stage === "needs_you"), [configured, localWork, requests]);

  return <div className="kurukoo-field min-w-0 pb-10">
    <section className="field-welcome" aria-labelledby="field-title">
      <div className="field-welcome-copy"><p className="field-kicker">{greeting(now.getHours())}, Kofi</p><h1 id="field-title">Your field</h1><p className="field-subtitle">Wake up. Get going.</p></div>
      <div className="field-welcome-meta"><div className="field-weather"><span className="field-sun">☼</span><strong>23°C</strong><span>•</span><span>Accra</span></div><div className="field-date"><CalendarDays className="size-4" /><span>{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><span className="field-notification"><Bell className="size-4" />{unread ? unread : ""}</span></div></div>
      <div className="field-horizon" aria-hidden="true"><span className="field-horizon-sun" /><span className="field-horizon-city" /><span className="field-horizon-water" /></div>
    </section>

    <section className="field-composer-card" aria-label="Ask Kurukoo">
      <div className="field-composer-label"><span>What needs your attention?</span><span className="field-composer-hint">Tell Kurukoo in your own words</span></div>
      <Composer onSend={send} placeholder="Ask Kurukoo to get something done…" />
    </section>

    {error ? <div role="alert" className="field-inline-alert"><CircleAlert className="size-4 shrink-0" />Live Field data could not be refreshed. No provider, payment or execution state is being inferred.</div> : null}

    <section className="field-main-grid" aria-label="Your day">
      <FieldCard className="field-requests-card"><CardHeading eyebrow="In motion" title="Active requests" action={<Link to="/work" className="field-card-action">View all <ArrowRight className="size-3.5" /></Link>} />
        {loading ? <div className="field-loading"><span /><span /><span /></div> : active.length ? <div className="field-request-list">{active.slice(0, 4).map((item, index) => <Link key={item.id} to="/work/$workId" params={{ workId: item.id }} className="field-request-row"><span className={`field-request-icon field-request-icon-${index % 3}`}><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><strong>{item.title}</strong><small>{item.detail}</small></span><StatusBadge tone={index === 0 ? "peach" : "green"}>{index === 0 ? "On the way" : "Scheduled"}</StatusBadge></Link>)}</div> : <div className="field-empty"><MessageCircle className="size-5" /><p>Nothing is in motion yet.</p><small>Start in Chat when you want Kurukoo to coordinate something.</small><AskKurukoo prompt="Help me get something done today">Start something</AskKurukoo></div>}
        {needsYou.length ? <div className="field-card-footer"><span><strong>{needsYou.length} waiting</strong> for your decision</span><Link to="/activity">Review <ArrowRight className="size-3.5" /></Link></div> : null}
      </FieldCard>

      <FieldCard className="field-flow-card"><CardHeading eyebrow="Today" title="Today's flow" action={<Link to="/activity" className="field-card-action">Full day <ArrowRight className="size-3.5" /></Link>} /><div className="field-timeline"><div className="field-timeline-item is-active"><span>08:00</span><i className="field-timeline-dot" /><div><strong>Focus time</strong><small>Deep work</small></div></div><div className="field-timeline-item"><span>11:00</span><i className="field-timeline-dot" /><div><strong>Delivery window</strong><small>Market items to Osu</small></div></div><div className="field-timeline-item"><span>13:00</span><i className="field-timeline-dot" /><div><strong>Lunch break</strong><small>Recharge</small></div></div><div className="field-timeline-item"><span>18:30</span><i className="field-timeline-dot" /><div><strong>Call Mum</strong><small>Check in and catch up</small></div></div><div className="field-timeline-item"><span>20:00</span><i className="field-timeline-dot" /><div><strong>Personal time</strong><small>Read and reflect</small></div></div></div></FieldCard>

      <div className="field-side-stack"><FieldCard className="field-agent-card"><CardHeading eyebrow="With a little help" title="Agent-assisted next steps" action={<span className="field-count">2</span>} /><div className="field-agent-row"><span className="field-agent-icon"><Sparkles className="size-4" /></span><span><strong>Prepare for client call</strong><small>Brief ready, 3 key points</small></span><Link to="/agents">Open</Link></div><div className="field-agent-row"><span className="field-agent-icon field-agent-icon-green"><CheckCircle2 className="size-4" /></span><span><strong>Grocery top-up</strong><small>Based on your list</small></span><Link to="/work">Review</Link></div><Link to="/agents" className="field-see-all">See all suggestions <ArrowRight className="size-3.5" /></Link></FieldCard><FieldCard className="field-people-card"><CardHeading title="Trusted people" action={<Link to="/connect" className="field-card-action">Manage <ArrowRight className="size-3.5" /></Link>} /><div className="field-people-row"><span className="field-person field-person-a">T</span><span className="field-person field-person-b">M</span><span className="field-person field-person-c">N</span><span className="field-person-add">+</span><div><strong>People you choose to keep close</strong><small>Consent and communication stay explicit.</small></div></div></FieldCard></div>
    </section>

    <section className="field-lower-grid"><FieldCard><CardHeading title="Nearby pulse" action={<Link to="/discover" className="field-card-action">See nearby <ArrowRight className="size-3.5" /></Link>} /><div className="field-lower-content"><span className="field-lower-icon field-lower-icon-green"><MapPin className="size-5" /></span><div><strong>{pulse?.active ? "You are available nearby" : "Local context when it is available"}</strong><small>{pulse?.active ? "Your Nearby Pulse presence is active." : pulse?.eligibleToBroadcast ? "You can choose to broadcast availability." : "Nearby Pulse is waiting on the readiness boundary."}</small></div></div></FieldCard><FieldCard><CardHeading title="Safety state" action={<Link to="/trust" className="field-card-action">Review <ArrowRight className="size-3.5" /></Link>} /><div className="field-lower-content"><span className="field-lower-icon field-lower-icon-gold"><ShieldCheck className="size-5" /></span><div><strong>Trust and permissions stay explicit</strong><small>Review before any consequential action.</small></div></div></FieldCard><FieldCard><CardHeading title="Task focus" action={<Link to="/work" className="field-card-action">Open <ArrowRight className="size-3.5" /></Link>} /><div className="field-lower-content"><span className="field-lower-icon"><Clock3 className="size-5" /></span><div><strong>{active[0]?.title ?? "Nothing is in motion"}</strong><small>{active[0]?.detail ?? "Your next action will appear here."}</small></div></div></FieldCard></section>

    {!configured ? <div className="field-preview-note">Development preview: the live backend is not configured in this frontend session. Local Work data may appear, but no external provider, payment, availability or fulfilment outcome is represented as real.</div> : null}
  </div>;
}
