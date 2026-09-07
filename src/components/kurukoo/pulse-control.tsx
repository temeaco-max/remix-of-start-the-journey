import { Link } from "@tanstack/react-router";
import { MapPin, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { activatePulse, deactivatePulse, fetchPulseReadiness, type PulseReadiness } from "@/lib/kurukoo-api";
import { cn } from "@/lib/utils";

type PulseControlProps = { compact?: boolean; className?: string; onChanged?: (readiness: PulseReadiness) => void };

export function PulseControl({ compact = false, className, onChanged }: PulseControlProps) {
  const [readiness, setReadiness] = useState<PulseReadiness | null>(null);
  const [skill, setSkill] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    const load = () => void fetchPulseReadiness().then((value) => { if (!cancelled) setReadiness(value); }).catch(() => { if (!cancelled) setReadiness(null); });
    load();
    const onPulse = () => load();
    window.addEventListener("kurukoo-pulse-updated", onPulse);
    const timer = window.setInterval(load, 30000);
    return () => { cancelled = true; window.removeEventListener("kurukoo-pulse-updated", onPulse); window.clearInterval(timer); };
  }, []);
  const active = Boolean(readiness?.active);
  const eligible = Boolean(readiness?.eligibleToBroadcast);
  const update = (value: PulseReadiness) => { setReadiness(value); onChanged?.(value); window.dispatchEvent(new Event("kurukoo-pulse-updated")); };
  async function start() {
    if (!eligible) return;
    if (!skill.trim()) { setMessage("Tell Kurukoo what you are available for."); return; }
    if (!navigator.geolocation) { setMessage("Location is required before Go Live."); return; }
    setBusy(true); setMessage("Requesting your location…");
    try { const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 })); await activatePulse(skill.trim(), position.coords.latitude, position.coords.longitude); update(await fetchPulseReadiness()); setMessage("You are live on Nearby Pulse."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start Nearby Pulse."); }
    finally { setBusy(false); }
  }
  async function stop() { setBusy(true); try { await deactivatePulse(); update(await fetchPulseReadiness()); setMessage("Nearby Pulse is off."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to stop Nearby Pulse."); } finally { setBusy(false); } }
  if (compact) return <div className={cn("rounded-xl bg-elevated/50 p-2.5", className)}><div className="flex items-center gap-2"><span className={cn("grid size-7 place-items-center rounded-full", active ? "bg-brand-tint text-brand-ink" : "bg-surface text-muted-foreground")}><Zap className="size-3.5"/></span><div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-medium">{active ? "Live on Nearby Pulse" : "Your availability"}</p><p className="truncate text-[10px] text-muted-foreground">{active ? "Nearby visibility is on" : eligible ? "Ready to Go Live" : "Provider readiness required"}</p></div></div>{active ? <button type="button" onClick={() => void stop()} disabled={busy} className="mt-2 min-h-8 w-full rounded-lg border border-border text-[10.5px] font-medium hover:bg-background disabled:opacity-50">{busy ? "Stopping…" : "Stop Go Live"}</button> : <><input value={skill} onChange={(event) => setSkill(event.target.value)} disabled={!eligible || busy} placeholder={eligible ? "e.g. oranges, suya, delivery" : "Provider skill"} className="mt-2 min-h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10.5px] outline-none disabled:opacity-50"/><button type="button" onClick={() => void start()} disabled={!eligible || busy} className="mt-1.5 min-h-8 w-full rounded-lg bg-primary px-2.5 text-[10.5px] font-medium text-primary-foreground disabled:opacity-50">{busy ? "Starting…" : "Go Live"}</button></>}<p className="mt-1.5 text-[9.5px] leading-4 text-muted-foreground" aria-live="polite">{message || readiness?.nudge}</p></div>;
  return <div className={cn("rounded-2xl border border-border bg-surface p-4", className)}><div className="flex items-start gap-3"><span className={cn("grid size-9 place-items-center rounded-xl", active ? "bg-brand-tint text-brand-ink" : "bg-elevated text-muted-foreground")}><Zap className="size-4"/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-[13.5px] font-semibold">{active ? "You're live on Nearby Pulse" : "Your availability"}</p>{active ? <span className="rounded-full bg-brand-tint px-2 py-1 text-[9.5px] font-medium text-brand-ink">Live</span> : null}</div><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{active ? "Nearby people can discover your available service. Your public position remains approximate and the session expires." : eligible ? "Choose what you are available for, then let nearby people discover you. This does not switch your role." : "Radar is available for local discovery. Go Live requires provider readiness and verification."}</p></div></div>{active ? <button type="button" onClick={() => void stop()} disabled={busy} className="mt-3 min-h-9 rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-elevated disabled:opacity-50">{busy ? "Stopping…" : "Stop Go Live"}</button> : <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={skill} onChange={(event) => setSkill(event.target.value)} disabled={!eligible || busy} placeholder={eligible ? "What are you available for? e.g. oranges, suya, delivery" : "Provider readiness required"} className="min-h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[11.5px] outline-none disabled:opacity-50"/><button type="button" onClick={() => void start()} disabled={!eligible || busy} className="min-h-9 rounded-lg bg-primary px-3 text-[11px] font-medium text-primary-foreground disabled:opacity-50">{busy ? "Starting…" : "Go Live"}</button></div>}<p className="mt-2 text-[10.5px] text-muted-foreground" aria-live="polite">{message || readiness?.nudge}</p><Link to="/discover" className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground"><MapPin className="size-3"/> Open Nearby</Link></div>;
}
