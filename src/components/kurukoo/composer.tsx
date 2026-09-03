import { ArrowUp, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: SpeechRecognitionLike = new Ctor();
  rec.lang = navigator.language || "en-GB";
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}

function Listening() {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary motion-safe:animate-pulse"
          style={{ height: `${6 + ((i % 3) + 1) * 4}px`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function Composer({
  onSend,
  placeholder = "Ask Kurukoo…",
}: {
  onSend: (text: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceAvailable(getRecognition() !== null);
    return () => recRef.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      setDraft(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        onSend(draft.trim());
        setDraft("");
      }}
      className="sticky bottom-20 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)] md:bottom-6"
    >
      <label htmlFor="ask" className="sr-only">
        Ask Kurukoo
      </label>
      <input
        id="ask"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={listening ? "Listening…" : placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
      />
      {listening ? <Listening /> : null}
      {voiceAvailable ? (
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : "Speak to Kurukoo"}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
            listening
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-elevated hover:text-foreground",
          )}
        >
          {listening ? <Square className="size-4" /> : <Mic className="size-[18px]" />}
        </button>
      ) : null}
      <button
        type="submit"
        disabled={!draft.trim()}
        aria-label="Send"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-35"
      >
        <ArrowUp className="size-[18px]" />
      </button>
    </form>
  );
}
