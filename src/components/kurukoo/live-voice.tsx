import { AudioLines, Volume2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createVoiceSession, endVoiceSession, executeVoiceTool, streamKurukooChat } from "@/lib/kurukoo-api";

type LiveVoiceProps = {
  triggerIcon?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  overlayTargetId?: string;
  conversationId?: string;
  onVoiceStateChange?: (active: boolean) => void;
};
type RecognitionAlternative = { transcript?: string };
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal?: boolean };
type RecognitionResultEvent = { results?: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: Recognition = new Ctor();
  rec.interimResults = true;
  rec.continuous = true;
  return rec;
}
const VOICE_PREFS_KEY = "kurukoo-voice-preferences";

export function LiveVoice({
  triggerIcon = <AudioLines className="size-[17px] text-muted-foreground" />,
  triggerLabel = "Talk to Kurukoo",
  triggerClassName = "grid size-9 place-items-center rounded-full hover:bg-elevated",
  overlayTargetId,
  conversationId,
  onVoiceStateChange,
}: LiveVoiceProps) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState("Voice mode is ready.");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [exchanges, setExchanges] = useState<Array<{ role: "user" | "assistant"; text: string }>>(
    [],
  );
  const replyRef = useRef("");
  const [style, setStyle] = useState<"calm" | "clear" | "warm">("calm");
  const [language, setLanguage] = useState("en-GB");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef<Recognition | null>(null);
  const sessionRef = useRef<{ sessionId: string; conversationId?: string } | null>(null);
  const nativeSessionRef = useRef<{ socket: WebSocket; stream: MediaStream; input: AudioContext; output: AudioContext } | null>(null);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const heardRef = useRef("");
  const submittedRef = useRef(false);
  const errorRef = useRef(false);
  const greetedRef = useRef(false);
  const stateNotifyRef = useRef(onVoiceStateChange);
  stateNotifyRef.current = onVoiceStateChange;

  useEffect(() => {
    const onPrefs = (event: Event) => {
      const d =
        (event as CustomEvent<{ style?: string; language?: string; ttsEnabled?: boolean }>)
          .detail || {};
      if (d.style === "calm" || d.style === "clear" || d.style === "warm") setStyle(d.style);
      if (typeof d.language === "string") setLanguage(d.language);
      if (typeof d.ttsEnabled === "boolean") setTtsEnabled(d.ttsEnabled);
    };
    window.addEventListener("kurukoo-voice-preferences", onPrefs);
    return () => window.removeEventListener("kurukoo-voice-preferences", onPrefs);
  }, []);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(VOICE_PREFS_KEY) || "{}");
      if (p.style === "calm" || p.style === "clear" || p.style === "warm") setStyle(p.style);
      if (typeof p.language === "string") setLanguage(p.language);
      if (typeof p.ttsEnabled === "boolean") setTtsEnabled(p.ttsEnabled);
    } catch {
      /* voice preferences are optional */
    }
  }, []);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("kurukoo-voice-state", {
        detail: { open, listening, speaking, style, language },
      }),
    );
    if (open) localStorage.setItem("kurukoo-voice-open", "1");
    else localStorage.removeItem("kurukoo-voice-open");
  }, [open, listening, speaking, style, language]);
  useEffect(
    () => () => {
      closingRef.current = true;
      openRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      closeNativeSession();
      if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, "client_unmount");
    },
    [],
  );

  async function ensureNativeSession() {
    if (nativeSessionRef.current) return nativeSessionRef.current;
    const session = await createVoiceSession({ conversationId, mode: "live" });
    if (!session.token || session.provider !== "gemini-live") throw new Error("Native live voice is unavailable right now.");
    const input = new AudioContext({ sampleRate: 16000 });
    const output = new AudioContext({ sampleRate: 24000 });
    await input.resume(); await output.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    // Exception to the no-credentials-in-URLs rule: browsers cannot set headers
    // on WebSocket handshakes, and this constrained endpoint requires query auth.
    // Exposure is bounded: single-use token, 60s expiry, server-constrained model.
    const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(session.token)}`);
    const native = { socket, stream, input, output }; nativeSessionRef.current = native; sessionRef.current = session;
    socket.onopen = () => {
      socket.send(JSON.stringify({ setup: { model: `models/${session.model}`, responseModalities: ["AUDIO"] } }));
      const source = input.createMediaStreamSource(stream);
      const processor = input.createScriptProcessor(4096, 1, 1);
      const silent = input.createGain(); silent.gain.value = 0;
      processor.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const inputData = event.inputBuffer.getChannelData(0); const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i += 1) pcm[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        const bytes = new Uint8Array(pcm.buffer); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
        socket.send(JSON.stringify({ realtimeInput: { audio: { data: window.btoa(binary), mimeType: "audio/pcm;rate=16000" } } }));
      };
      source.connect(processor); processor.connect(silent); silent.connect(input.destination); setListening(true); setStatus("Listening with Gemini Live…");
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data || "{}")) as Record<string, any>;
      const parts = message?.serverContent?.modelTurn?.parts || [];
      let audible = false;
      for (const part of parts) {
        if (typeof part?.text === "string") {
          replyRef.current = `${replyRef.current}${part.text}`;
          setReply(replyRef.current);
        }
        if (typeof part?.inlineData?.data === "string") {
          audible = true; const binary = window.atob(part.inlineData.data); const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          const pcm = new Int16Array(bytes.buffer); const samples = new Float32Array(pcm.length);
          for (let i = 0; i < pcm.length; i += 1) samples[i] = pcm[i] / 32768;
          const buffer = output.createBuffer(1, samples.length, 24000); buffer.copyToChannel(samples, 0);
          const source = output.createBufferSource(); source.buffer = buffer; source.connect(output.destination); source.start();
        }
      }
      if (Array.isArray(message?.toolCall?.functionCalls) && socket.readyState === WebSocket.OPEN) {
        void Promise.all(message.toolCall.functionCalls.map(async (call: { name?: string; id?: string; args?: Record<string, unknown> }) => {
          const response = await executeVoiceTool(session.sessionId, String(call.name || ''), call.args || {});
          return { name: String(call.name || ''), id: String(call.id || ''), response: { result: response.result ?? { ok: false } } };
        })).then((functionResponses) => socket.send(JSON.stringify({ toolResponse: { functionResponses } }))).catch(() => undefined);
      }
      const inputText = message?.serverContent?.inputTranscription?.text; const outputText = message?.serverContent?.outputTranscription?.text;
      if (inputText) { heardRef.current = inputText; setHeard(inputText); }
      if (outputText) { replyRef.current = outputText; setReply(outputText); }
      if (message?.serverContent?.interrupted) setSpeaking(false);
      if (audible || parts.some((part: any) => typeof part?.inlineData?.data === "string")) setSpeaking(true);
      if (message?.serverContent?.turnComplete) {
        setSpeaking(false);
        const userText = heardRef.current.trim();
        const assistantText = replyRef.current.trim();
        const done: Array<{ role: "user" | "assistant"; text: string }> = [];
        if (userText) done.push({ role: "user", text: userText });
        if (assistantText) done.push({ role: "assistant", text: assistantText });
        if (done.length) setExchanges((current) => [...current, ...done].slice(-6));
        heardRef.current = "";
        replyRef.current = "";
        setHeard("");
        setReply("");
        setStatus("You can keep talking.");
      }
    };
    socket.onerror = () => setStatus("Native live voice could not connect. Try again or continue in Chat.");
    return native;
  }

  function closeNativeSession() {
    const native = nativeSessionRef.current; nativeSessionRef.current = null;
    if (!native) return;
    try { native.socket.close(); } catch { /* already closed */ }
    native.stream.getTracks().forEach((track) => track.stop()); void native.input.close(); void native.output.close();
  }

  async function ensureSession() {
    if (sessionRef.current) return sessionRef.current;
    setStatus("Starting your voice session…");
    const s = await createVoiceSession({ conversationId, mode: "in_chat" });
    sessionRef.current = s;
    return s;
  }

  function continueLoop() {
    if (openRef.current && !closingRef.current) {
      submittedRef.current = false;
      startListening();
    } else {
      setListening(false);
      setSpeaking(false);
    }
  }

  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        setSpeaking(false);
        resolve();
        continueLoop();
      };
      setSpeaking(true);
      if (ttsEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = language;
        u.rate = style === "clear" ? 0.94 : style === "warm" ? 0.98 : 0.9;
        u.pitch = style === "warm" ? 1.04 : style === "clear" ? 0.98 : 0.92;
        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.speak(u);
        return;
      }
      void fetchLocalTts(text).then(finish);
    });
  }

  async function fetchLocalTts(text: string): Promise<void> {
    try {
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        setStatus("You can keep talking. (Spoken audio is not available right now.)");
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
      const audioContext = new (window.AudioContext || w.webkitAudioContext!)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await new Promise<void>((done) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => done();
        source.start(0);
      }).finally(() => {
        void audioContext.close().catch(() => undefined);
      });
    } catch {
      setStatus("You can keep talking. (Spoken audio is not available right now.)");
    }
  }

  async function fetchProfileName(): Promise<string | null> {
    try {
      const response = await fetch("/api/user/profile", { credentials: "include" });
      if (!response.ok) return null;
      const payload = (await response.json()) as { profile?: { name?: string | null } };
      const name = payload.profile?.name?.trim();
      return name || null;
    } catch {
      return null;
    }
  }

  async function greetAndListen() {
    try {
      const s = await ensureSession();
      if (!openRef.current || !s) {
        continueLoop();
        return;
      }
      const name = await fetchProfileName();
      if (!openRef.current) {
        continueLoop();
        return;
      }
      greetedRef.current = true;
      setStatus(
        name ? `Good to see you, ${name}. What needs doing today?` : "What needs doing today?",
      );
      await speak(
        name
          ? `Hi, I'm Kurukoo. Good to see you, ${name}. What needs doing today?`
          : `Hi, I'm Kurukoo. What should I call you, and what needs doing today?`,
      );
    } catch {
      continueLoop();
    }
  }

  async function submitSpokenRequest(text: string) {
    const clean = text.replace(/^[,.:;\s]+/, "").trim();
    if (!clean || submittedRef.current) {
      if (!clean) setStatus("I'm listening for what you need.");
      else continueLoop();
      return;
    }
    submittedRef.current = true;
    setListening(false);
    setExchanges((current) => [...current, { role: "user" as const, text: clean }].slice(-6));
    try {
      const s = await ensureSession();
      if (!openRef.current) {
        continueLoop();
        return;
      }
      setStatus("Kurukoo is working on it…");
      replyRef.current = "";
      setReply("");
      const result = await streamKurukooChat({
        message: clean,
        conversationId: s.conversationId,
        channel: "web_voice",
        onEvent: (e) => {
          if (e.type === "conversation" && e.conversationId) {
            s.conversationId = e.conversationId;
            sessionRef.current = s;
          }
        },
      });
      if (!openRef.current) {
        continueLoop();
        return;
      }
      s.conversationId = result.conversationId;
      replyRef.current = result.reply;
      setReply(result.reply);
      if (result.reply.trim()) {
        setExchanges((current) =>
          [...current, { role: "assistant" as const, text: result.reply.trim() }].slice(-6),
        );
      }
      setStatus("You can keep talking.");
      if (result.reply) await speak(result.reply);
      else continueLoop();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Voice conversation is unavailable right now.",
      );
      continueLoop();
    }
  }

  function startListening() {
    if (!openRef.current || closingRef.current) return;
    const r = getRecognition();
    if (!r) {
      setStatus(
        "Voice input is not available in this browser. You can use the text composer instead.",
      );
      return;
    }
    errorRef.current = false;
    submittedRef.current = false;
    r.continuous = true;
    r.lang = language;
    heardRef.current = "";
    setHeard("");
    setListening(true);
    setStatus("Listening…");
    r.onresult = (e) => {
      const results = Array.from(e.results || []);
      const text = results
        .map((x) => x?.[0]?.transcript || "")
        .join(" ")
        .trim();
      heardRef.current = text;
      setHeard(text);
      const hasFinal = results.some((x) => x?.isFinal);
      if (hasFinal && text && !submittedRef.current) {
        try {
          r.stop();
        } catch {
          /* recognition already ended */
        }
        setListening(false);
        void submitSpokenRequest(text);
      }
    };
    r.onend = () => {
      setListening(false);
      if (errorRef.current || closingRef.current || !openRef.current) return;
      if (submittedRef.current) return;
      const text = heardRef.current.trim();
      if (text) {
        void submitSpokenRequest(text);
        return;
      }
      startListening();
    };
    r.onerror = () => {
      errorRef.current = true;
      setListening(false);
      if (!openRef.current || closingRef.current) return;
      setStatus("I couldn't hear that clearly. Try again.");
    };
    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      setListening(false);
      setStatus("Voice input could not start in this browser.");
    }
  }

  function stopSession(reason: "user_closed" | "user_toggled") {
    closingRef.current = true;
    openRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* recognition already ended */
    }
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setListening(false);
    setSpeaking(false);
    closeNativeSession();
    if (sessionRef.current) void endVoiceSession(sessionRef.current.sessionId, reason);
    sessionRef.current = null;
    greetedRef.current = false;
    replyRef.current = "";
    heardRef.current = "";
    setHeard("");
    setReply("");
    setExchanges([]);
    setOpen(false);
    stateNotifyRef.current?.(false);
  }

  function toggle() {
    if (openRef.current) {
      stopSession("user_toggled");
      return;
    }
    closingRef.current = false;
    openRef.current = true;
    greetedRef.current = false;
    setOpen(true);
    stateNotifyRef.current?.(true);
    setStatus("Starting your voice session…");
    if (overlayTargetId) {
      window.setTimeout(
        () =>
          document
            .getElementById(overlayTargetId)
            ?.scrollIntoView({ behavior: "smooth", block: "end" }),
        80,
      );
    }
    void (async () => {
      try { await ensureNativeSession(); }
      catch { setStatus("Native live voice is unavailable. Continuing with browser voice and Chat."); greetAndListen(); }
    })();
  }

  const browserVoice =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const active = listening || speaking;
  const card = open ? (
    <section
      aria-label="Kurukoo voice"
      className={overlayTargetId ? "px-3 pb-3" : "fixed inset-x-0 bottom-0 z-[100] px-3 pb-3"}
    >
      <div className="mx-auto w-full max-w-[640px] rounded-2xl border border-border bg-surface/95 shadow-[var(--shadow-lift)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 pt-3.5">
          <span
            className={`relative grid size-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink ${active ? "motion-safe:animate-pulse" : ""}`}
            aria-hidden="true"
          >
            <AudioLines className="size-5" strokeWidth={1.8} />
            {active ? (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary motion-safe:animate-ping" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">
              {active ? "Voice: Active" : "Voice session"}
            </p>
            <p className="truncate text-[11.5px] text-muted-foreground" aria-live="polite">
              {status}
            </p>
          </div>
          <button
            type="button"
            onClick={() => stopSession("user_closed")}
            aria-label="Stop voice session"
            className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-elevated"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="max-h-[38vh] min-h-[96px] overflow-y-auto px-4 pb-4">
          {exchanges.map((exchange, index) => (
            <p
              key={`${exchange.role}-${index}`}
              className={
                exchange.role === "user"
                  ? "mt-2.5 rounded-2xl rounded-tr-md border border-border bg-background px-4 py-2.5 text-[13px]"
                  : "mt-2.5 rounded-2xl rounded-tl-md bg-elevated px-4 py-2.5 text-left text-[13px] leading-relaxed"
              }
            >
              {exchange.role === "user" ? `“${exchange.text}”` : exchange.text}
            </p>
          ))}
          {heard ? (
            <p className="mt-2.5 rounded-2xl rounded-tr-md border border-border bg-background px-4 py-2.5 text-[13px]">
              “{heard}”
            </p>
          ) : null}
          {reply ? (
            <div className="mt-2.5 rounded-2xl rounded-tl-md bg-elevated px-4 py-2.5 text-left text-[13px] leading-relaxed">
              <div className="mb-1.5 flex items-center gap-2 text-[10.5px] font-medium text-muted-foreground">
                <Volume2 className="size-3.5" /> Spoken reply
              </div>
              {reply}
            </div>
          ) : null}
          {!browserVoice ? (
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              This browser does not expose speech recognition. You can use the text composer
              instead.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  ) : null;
  return (
    <>
      <span className="relative inline-flex">
        <button
          type="button"
          aria-label={open ? "Stop voice session" : triggerLabel}
          title={open ? "Stop voice session" : triggerLabel}
          aria-pressed={open}
          onClick={toggle}
          disabled={!browserVoice}
          className={triggerClassName}
        >
          {triggerIcon}
        </button>
        {open ? (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary motion-safe:animate-ping" />
        ) : null}
      </span>
      {overlayTargetId && typeof document !== "undefined"
        ? createPortal(card, document.getElementById(overlayTargetId) || document.body)
        : card}
    </>
  );
}
