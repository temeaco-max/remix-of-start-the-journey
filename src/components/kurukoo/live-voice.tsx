import { AudioLines, Check, Mic2, Settings, X, Volume2, Waves } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createVoiceSession, endVoiceSession, streamKurukooChat } from "@/lib/kurukoo-api";

type LiveVoiceProps = {
  triggerIcon?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  overlayTargetId?: string;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: Recognition = new Ctor();
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}

const VOICE_PREFS_KEY = "kurukoo-voice-preferences";
const WAKE_PREF_KEY = "kurukoo-voice-wake";
const voiceLanguages = [
  ["en-GB", "English (UK)"],
  ["en-US", "English (US)"],
  ["fr-FR", "Français"],
  ["es-ES", "Español"],
  ["pt-BR", "Português"],
  ["sw-KE", "Kiswahili"],
] as const;
const voiceStyles = [
  ["calm", "Calm"],
  ["clear", "Clear"],
  ["warm", "Warm"],
] as const;

export function LiveVoice({
  triggerIcon = <Mic2 className="size-[17px] text-muted-foreground" />,
  triggerLabel = "Talk to Kurukoo",
  triggerClassName = "grid size-9 place-items-center rounded-full hover:bg-elevated",
  overlayTargetId,
}: LiveVoiceProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeListening, setWakeListening] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [status, setStatus] = useState("Voice mode is ready. Say “Hey Kurukoo” or start talking.");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [style, setStyle] = useState<"calm" | "clear" | "warm">("calm");
  const [language, setLanguage] = useState("en-GB");
  const recognitionRef = useRef<Recognition | null>(null);
  const sessionRef = useRef<{ sessionId: string; conversationId?: string } | null>(null);
  const wakeArmedRef = useRef(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const onPrefs = (event: Event) => {
      const detail = (event as CustomEvent<{ style?: string; language?: string }>).detail || {};
      if (detail.style === "calm" || detail.style === "clear" || detail.style === "warm") setStyle(detail.style);
      if (typeof detail.language === "string" && detail.language) setLanguage(detail.language);
    };
    window.addEventListener("kurukoo-voice-preferences", onPrefs);
    return () => window.removeEventListener("kurukoo-voice-preferences", onPrefs);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(VOICE_PREFS_KEY) || "{}");
      if (stored.style === "calm" || stored.style === "clear" || stored.style === "warm") setStyle(stored.style);
      if (typeof stored.language === "string" && stored.language) setLanguage(stored.language);
      setWakeEnabled(localStorage.getItem(WAKE_PREF_KEY) === "true");
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("kurukoo-voice-state", { detail: { open, listening, wakeListening, style, language } }));
    if (open) localStorage.setItem("kurukoo-voice-open", "1");
    else localStorage.removeItem("kurukoo-voice-open");
    return () => { window.dispatchEvent(new CustomEvent("kurukoo-voice-state", { detail: { open: false, listening: false, wakeListening: false } })); };
  }, [open, listening, wakeListening, style, language]);

  useEffect(() => () => {
    closingRef.current = true;
    recognitionRef.current?.stop();
    if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, "client_unmount");
  }, []);

  function savePrefs(nextStyle = style, nextLanguage = language) {
    localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify({ style: nextStyle, language: nextLanguage }));
    window.dispatchEvent(new CustomEvent("kurukoo-voice-preferences", { detail: { style: nextStyle, language: nextLanguage } }));
  }

  async function ensureSession() {
    if (sessionRef.current) return sessionRef.current;
    setStatus("Starting your voice session…");
    const session = await createVoiceSession();
    sessionRef.current = session;
    return session;
  }

  async function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = style === "clear" ? 0.94 : style === "warm" ? 0.98 : 0.9;
    utterance.pitch = style === "warm" ? 1.04 : style === "clear" ? 0.98 : 0.92;
    window.speechSynthesis.speak(utterance);
  }

  async function submitSpokenRequest(text: string) {
    const clean = text.replace(/^[,.:;\s]+/, "").trim();
    if (!clean) { setStatus("I'm listening for what you need."); return; }
    try {
      const session = await ensureSession();
      setStatus("Kurukoo is working on it…");
      setReply("");
      const result = await streamKurukooChat({
        message: clean,
        conversationId: session.conversationId,
        channel: "web_voice",
        onEvent: (event) => {
          if (event.type === "conversation" && event.conversationId) session.conversationId = event.conversationId;
        },
      });
      session.conversationId = result.conversationId;
      setReply(result.reply);
      setStatus("You can keep talking.");
      if (result.reply) await speak(result.reply);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Voice conversation is unavailable right now.");
    }
  }

  function startListening() {
    const recognition = getRecognition();
    if (!recognition) {
      setStatus("Voice input is not available in this browser. You can use the text composer instead.");
      return;
    }
    wakeArmedRef.current = false;
    recognition.continuous = false;
    recognition.lang = language;
    setHeard("");
    setStatus("Listening…");
    recognition.onresult = (event) => {
      const text = Array.from(event.results || []).map((result: any) => result?.[0]?.transcript || "").join(" ").trim();
      setHeard(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setStatus("I couldn't hear that clearly. Try again.");
    };
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setListening(false); }
  }

  function startWakePhraseListener() {
    const recognition = getRecognition();
    if (!recognition) {
      setStatus("Wake phrase listening is not available in this browser.");
      return;
    }
    closingRef.current = false;
    wakeArmedRef.current = false;
    recognition.continuous = true;
    recognition.lang = language;
    setHeard("");
    setStatus("Listening for “Hey Kurukoo”…");
    recognition.onresult = (event) => {
      const text = Array.from(event.results || []).map((result: any) => result?.[0]?.transcript || "").join(" ").trim();
      const wake = /\bhey\s+kurukoo\b/i.exec(text);
      if (wake) {
        const afterWake = text.slice((wake.index ?? 0) + wake[0].length).trim();
        setHeard(afterWake || "Hey Kurukoo");
        wakeArmedRef.current = !afterWake;
        if (afterWake) {
          recognition.stop();
          setWakeListening(false);
          void submitSpokenRequest(afterWake);
        } else {
          setStatus("I'm listening for what you need.");
        }
      } else if (wakeArmedRef.current && text) {
        recognition.stop();
        setWakeListening(false);
        wakeArmedRef.current = false;
        setHeard(text);
        void submitSpokenRequest(text);
      }
    };
    recognition.onend = () => {
      setWakeListening(false);
      if (!closingRef.current) setStatus("Wake phrase listening stopped. Start it again when ready.");
    };
    recognition.onerror = () => {
      setWakeListening(false);
      wakeArmedRef.current = false;
      setStatus("Wake phrase listening stopped. Try again.");
    };
    recognitionRef.current = recognition;
    try { recognition.start(); setWakeListening(true); } catch { setWakeListening(false); }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setWakeListening(false);
    wakeArmedRef.current = false;
  }

  async function handleStopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    const text = heard.trim();
    if (!text) { setStatus("No spoken request was captured."); return; }
    await submitSpokenRequest(text);
  }

  function toggleWakeEnabled() {
    const next = !wakeEnabled;
    setWakeEnabled(next);
    localStorage.setItem(WAKE_PREF_KEY, String(next));
    if (next && open) startWakePhraseListener();
    if (!next) stopListening();
  }

  function close() {
    closingRef.current = true;
    stopListening();
    window.speechSynthesis?.cancel();
    setSettingsOpen(false);
    if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, "user_closed");
    sessionRef.current = null;
    setOpen(false);
  }

  const browserVoice = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const overlay = open ? (
    <div role="dialog" aria-modal="true" aria-label="Croon voice mode" className={overlayTargetId ? "absolute inset-0 z-[100] flex min-h-full flex-col overflow-hidden bg-background/98 backdrop-blur-xl" : "fixed inset-0 z-[100] flex min-h-screen flex-col bg-background lg:right-[224px]"}>
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border px-5 md:px-8">
        <div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-lg bg-brand-tint text-brand-ink"><AudioLines className="size-4" /></div><div><p className="text-[13px] font-semibold">Croon</p><p className="text-[10px] text-muted-foreground">Voice conversation with Kurukoo</p></div></div>
        <div className="flex items-center gap-1"><button type="button" onClick={() => setSettingsOpen((value) => !value)} aria-label="Voice settings" aria-expanded={settingsOpen} title="Voice settings" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><Settings className="size-[17px]" /></button><button type="button" onClick={close} aria-label="Close voice mode" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><X className="size-[18px]" /></button></div>
        {settingsOpen ? <div className="absolute right-5 top-[62px] z-[120] w-[min(340px,calc(100vw-40px))] rounded-2xl border border-border bg-surface p-4 text-left shadow-[var(--shadow-lift)]"><div className="flex items-center gap-2"><Settings className="size-4 text-primary"/><p className="text-[12px] font-semibold">Voice settings</p></div><label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Language<select value={language} onChange={(event) => { const next = event.target.value; setLanguage(next); savePrefs(style, next); }} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] font-medium outline-none">{voiceLanguages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Voice style<select value={style} onChange={(event) => { const next = event.target.value as "calm" | "clear" | "warm"; setStyle(next); savePrefs(next, language); }} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] font-medium outline-none">{voiceStyles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={toggleWakeEnabled} disabled={!browserVoice} className="mt-4 flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left disabled:opacity-50"><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${wakeEnabled ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}>{wakeEnabled ? <Check className="size-4" /> : <Waves className="size-4" />}</span><span className="min-w-0"><span className="block text-[11.5px] font-semibold">Hey Kurukoo wake phrase</span><span className="mt-0.5 block text-[10.5px] leading-4 text-muted-foreground">When enabled, this Voice screen can listen for “Hey Kurukoo” before capturing the request. It is not an operating-system-wide wake word.</span></span></button><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Preferences are saved on this device and apply to future Croon voice sessions.</p></div> : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
        <div className={`relative grid size-36 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink transition-all duration-500 ${listening || wakeListening ? "scale-110 shadow-[0_0_0_18px_var(--brand-tint)]" : ""}`}><div className={`grid size-24 place-items-center rounded-full bg-background/80 ${listening || wakeListening ? "animate-pulse" : ""}`}><AudioLines className="size-9" strokeWidth={1.5} /></div></div>
        <p className="mt-8 text-[24px] font-semibold tracking-tight">{wakeListening ? "Listening for Hey Kurukoo" : listening ? "I'm listening" : "Voice mode"}</p>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">{status}</p>
        {heard ? <p className="mt-5 max-w-xl rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] text-foreground">“{heard}”</p> : null}
        {reply ? <div className="mt-4 max-w-xl rounded-2xl bg-elevated px-4 py-3 text-left text-[13px] leading-relaxed"><div className="mb-2 flex items-center gap-2 text-[10.5px] font-medium text-muted-foreground"><Volume2 className="size-3.5" /> Spoken reply</div>{reply}</div> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2"><button type="button" onClick={() => listening ? void handleStopListening() : wakeListening ? stopListening() : startListening()} disabled={!browserVoice} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[12px] font-medium text-background disabled:opacity-40"><Mic2 className="size-4" />{listening ? "Finish speaking" : wakeListening ? "Stop listening" : "Start talking"}</button><button type="button" onClick={() => wakeListening ? stopListening() : startWakePhraseListener()} disabled={!browserVoice} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-medium disabled:opacity-40 ${wakeListening ? "border-primary/30 bg-brand-tint text-brand-ink" : "border-border bg-surface hover:bg-elevated"}`}><Waves className="size-4" />{wakeListening ? "Listening…" : "Hey Kurukoo"}</button></div>
        {!browserVoice ? <p className="mt-3 text-[10.5px] text-muted-foreground">This browser does not expose speech recognition.</p> : <p className="mt-3 max-w-md text-[10.5px] leading-4 text-muted-foreground">For hands-free use in this screen, start “Hey Kurukoo” listening, then say your request naturally.</p>}
      </div>
      <footer className="shrink-0 pb-7 text-center text-[10px] text-muted-foreground">Voice uses the same Kurukoo conversation relationship as text. Your session can continue in Chat history.</footer>
    </div>
  ) : null;

  useEffect(() => {
    if (open && wakeEnabled && browserVoice && !wakeListening && !listening) startWakePhraseListener();
  }, [open, wakeEnabled]);

  return (
    <>
      <span className="relative inline-flex">
        <button type="button" aria-label={triggerLabel} title={triggerLabel} onClick={() => { closingRef.current = false; setOpen(true); }} className={triggerClassName}>
          {triggerIcon}
        </button>
      </span>
      {overlayTargetId && typeof document !== "undefined" ? createPortal(overlay, document.getElementById(overlayTargetId) || document.body) : overlay}
    </>
  );
}