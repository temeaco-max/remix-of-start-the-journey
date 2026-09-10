import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Radio, RefreshCw } from "lucide-react";
import { actionClass } from "@/components/kurukoo/primitives";
import { fetchChannelReadiness, isKurukooApiConfigured, type ChannelStatus } from "@/lib/kurukoo-api";

/* Live communication-channel activation states, served by /api/content/channels.
   Rendered inside the authenticated Connect page so users see the real state of
   each channel on their own account surface. */

const CHANNEL_LABELS: Array<[string, string]> = [
  ["whatsapp", "WhatsApp"],
  ["telegram", "Telegram"],
  ["sms", "SMS"],
  ["ussd", "USSD"],
  ["email", "Email"],
  ["fcm", "Push (FCM)"],
  ["voice", "Voice"],
];

const FALLBACK_STATUSES: Record<string, string | { state?: string; note?: string } | null> = {
  web: "IMPLEMENTED",
  whatsapp: null,
  telegram: null,
  sms: null,
  ussd: null,
  email: null,
  fcm: null,
  voice: null,
};

type ChannelState = string | { state?: string; note?: string } | null | undefined;

function stateText(state: ChannelState): string | null {
  if (!state) return null;
  if (typeof state === "string") return state;
  return state.state ?? null;
}

function stateNote(state: ChannelState): string | null {
  if (state && typeof state === "object") return state.note ?? null;
  return null;
}

function readinessLabel(state: ChannelState) {
  const value = stateText(state);
  if (!value) return "Not registered";
  return value.replaceAll("_", " ");
}

function stateTone(state: ChannelState) {
  const value = stateText(state);
  return value === "PRODUCTION_ACTIVE" || value === "IMPLEMENTED" || value === "READY"
    ? "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";
}

export function ChannelActivationStates() {
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(isKurukooApiConfigured());

  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    let cancelled = false;
    fetchChannelReadiness()
      .then((next) => { if (!cancelled) setStatus(next); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const channelStatuses = status?.channelStatuses ?? FALLBACK_STATUSES;
  const integrationList = status?.integrationReadiness ?? [];
  const external = integrationList.filter((item) => !["sources", "channels"].includes(item.category ?? ""));

  return (
    <section>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Channels</p>
      <h2 className="mt-1.5 font-serif text-[29px] tracking-[-0.035em]">Channel activation states</h2>
      <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
        Web Chat is available now. Every other channel is shown with its actual activation state — configuration alone never means that an external message was delivered.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-[19px] border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <MessageCircle className="size-5 text-primary" />
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Implemented</span>
          </div>
          <h3 className="mt-4 text-[14.5px] font-semibold">Web Chat</h3>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Start a conversation, review request details, manage reminders and continue protected actions when identity is required.</p>
          <Link to="/chat" className={`${actionClass("primary")} mt-4`}>Start chatting</Link>
        </article>
        {loading ? (
          <div className="flex items-center gap-2 rounded-[19px] border border-border bg-surface p-5 text-[11.5px] text-muted-foreground"><RefreshCw className="size-4 animate-spin" aria-hidden="true" /> Loading channel states…</div>
        ) : CHANNEL_LABELS.map(([id, label]) => {
          const state = channelStatuses[id] ?? null;
          const note = stateNote(state);
          return (
            <article key={id} className="rounded-[19px] border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <Radio className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stateTone(state)}`}>{readinessLabel(state)}</span>
              </div>
              <h3 className="mt-4 text-[14.5px] font-semibold">{label}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{note ?? (state ? "Activation follows the canonical readiness and evidence states, shown here truthfully." : "Not yet registered in this deployment. The architecture stays ready for activation.")}</p>
            </article>
          );
        })}
      </div>
      {external.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[15px] font-semibold">Connected services</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {external.map((item) => (
              <article key={item.id} className="rounded-[19px] border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-[13.5px] font-semibold">{item.name ?? item.id}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stateTone(item.uiState ?? null)}`}>{readinessLabel(item.uiState ?? null)}</span>
                </div>
                {item.summary && <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{item.summary}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
