import { AudioLines, Mic2, X, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createVoiceSession, endVoiceSession, streamKurukooChat } from "@/lib/kurukoo-api";

type LiveVoiceProps = {
  triggerIcon?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
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

export function LiveVoice({
  triggerIcon = <Mic2 className="size-[17px] text-muted-foreground" />,
  triggerLabel = "Talk to Kurukoo",
  triggerClassName = "grid size-9 place-items-center rounded-full hover:bg-elevated",
}: LiveVoiceProps) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Voice mode is ready.");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [style, setStyle] = useState<"calm" | "clear" | "warm">("calm");
  const [language, setLanguage] = useState("en-GB");
  const recognitionRef = useRef<Recognition | null>(null);
  const sessionRef = useRef<{ sessionId: string; conversationId?: string } | null>(null);

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
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("kurukoo-voice-state", { detail: { open, listening, style, language } }));
    if (open) localStorage.setItem("kurukoo-voice-open", "1");
    else localStorage.removeItem("kurukoo-voice-open");
    return () => { window.dispatchEvent(new CustomEvent("kurukoo-voice-state", { detail: { open: false, listening: false } })); };
  }, [open, listening, style, language]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, "client_unmount");
  }, []);

  function savePrefs(nextStyle = style, nextLanguage = language) {
    localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify({ style: nextStyle, language: nextLanguage }));
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

  function startListening() {
    const recognition = getRecognition();
    if (!recognition) {
      setStatus("Voice input is not available in this browser. You can use the text composer instead.");
      return;
    }
    recognition.lang = language;
    setHeard("");
    setStatus("Listening…");
    recognition.onresult = (event) => {
      const text = Array.from(event.results || []).map((result: any) => result?.[0]?.transcript || "").join(" ").trim();
      setHeard(text);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      setStatus("I couldn't hear that clearly. Try again.");
    };
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setListening(false); }
  }

  async function handleStopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    const text = heard.trim();
    if (!text) { setStatus("No spoken request was captured."); return; }
    try {
      const session = await ensureSession();
      setStatus("Kurukoo is thinking…");
      setReply("");
      const result = await streamKurukooChat({
        message: text,
        conversationId: session.conversationId,
        onEvent: (event) => {
          if (event.type === "conversation" && event.conversationId) {
            session.conversationId = event.conversationId;
          }
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

  function close() {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setListening(false);
    if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, "user_closed");
    sessionRef.current = null;
    setOpen(false);
  }

  const browserVoice = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  return (
    <>
      <span className="relative inline-flex">
        <button type="button" aria-label={triggerLabel} title={triggerLabel} onClick={() => setOpen(true)} className={triggerClassName}>
          {triggerIcon}
        </button>
      </span>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Voice mode" className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-background lg:right-[224px]">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5 md:px-8">
            <div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-lg bg-brand-tint text-brand-ink"><AudioLines className="size-4" /></div><div><p className="text-[13px] font-semibold">Kurukoo</p><p className="text-[10px] text-muted-foreground">Voice conversation</p></div></div>
            <button type="button" onClick={close} aria-label="Close voice mode" className="grid size-9 place-items-center rounded-full hover:bg-elevated"><X className="size-[18px]" /></button>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className={`relative grid size-36 place-items-center rounded-full bg-brand-tint text-brand-ink transition-all duration-500 ${listening ? "scale-110 shadow-[0_0_0_18px_var(--brand-tint)]" : ""}`}><div className={`grid size-24 place-items-center rounded-full bg-background/80 ${listening ? "animate-pulse" : ""}`}><AudioLines className="size-9" strokeWidth={1.5} /></div></div>
            <p className="mt-8 text-[24px] font-semibold tracking-tight">{listening ? "I'm listening" : "Voice mode"}</p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">{status}</p>
            {heard ? <p className="mt-5 max-w-xl rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] text-foreground">“{heard}”</p> : null}
            {reply ? <div className="mt-4 max-w-xl rounded-2xl bg-elevated px-4 py-3 text-left text-[13px] leading-relaxed"><div className="mb-2 flex items-center gap-2 text-[10.5px] font-medium text-muted-foreground"><Volume2 className="size-3.5" /> Spoken reply</div>{reply}</div> : null}
            <button type="button" onClick={() => listening ? void handleStopListening() : startListening()} disabled={!browserVoice} className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[12px] font-medium text-background disabled:opacity-40"><Mic2 className="size-4" />{listening ? "Finish speaking" : "Start talking"}</button>
            {!browserVoice ? <p className="mt-3 text-[10.5px] text-muted-foreground">This browser does not expose speech recognition.</p> : null}
          </div>
          <footer className="pb-7 text-center text-[10px] text-muted-foreground">Voice uses the same Kurukoo conversation relationship as text. Your session can continue in Chat history.</footer>
        </div>
      ) : null}
    </>
  );
}
