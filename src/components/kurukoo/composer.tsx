import {
  ArrowUp,
  AudioLines,
  ChevronDown,
  MapPin,
  Mic,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { LiveVoice } from "@/components/kurukoo/live-voice";
import { useUserLocation } from "@/lib/user-location-state";
import { cn } from "@/lib/utils";

type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
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
  const rec = new Ctor();
  rec.lang = navigator.language || "en-GB";
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}
const placeholderExamples = [
  "get me an okada",
  "fix my phone",
  "set a reminder",
  "sell my item",
  "promote something",
  "find me a mechanic",
  "call someone",
  "track my order",
  "call me a doctor",
  "setup a money circle",
  "book me an artist",
  "teach me a subject",
  "book me a flight",
  "book me a hotel room",
  "find me an errand boy",
  "get me a house helper",
  "find me a local agent",
  "get me a driver",
  "find me the nearest filling station",
  "find me a car part",
  "get me a job",
  "order an event ticket",
  "find me an event planner",
  "book me an event centre",
  "tell me a story",
  "top up my phone",
  "refer my friend to Kurukoo",
  "find me a part time job",
  "refer a business to Kurukoo",
  "find me a task i can earn from",
  "find me a ride share",
  "book me an Uber",
  "book me a Bolt",
  "get me garri",
  "teach me how to make fried rice",
  "handle my sales",
];

export type SlashCommand = {
  trigger: string;
  label: string;
  description: string;
  skill: string;
  category: string;
};

const SLASH_COMMANDS: SlashCommand[] = [
  {
    trigger: "/paybill",
    label: "Pay a bill",
    description: "Pay electricity, internet, TV, or other bills",
    skill: "pay_bill",
    category: "finance-tax",
  },
  {
    trigger: "/topup",
    label: "Top up airtime/data",
    description: "Buy airtime or data bundles for any network",
    skill: "airtime_purchase",
    category: "communication-telecom",
  },
  {
    trigger: "/ride",
    label: "Book a ride",
    description: "Okada, keke, taxi, or car ride",
    skill: "ride_request",
    category: "transport-mobility",
  },
  {
    trigger: "/okada",
    label: "Book an okada",
    description: "Quick motorcycle ride",
    skill: "okada_rider",
    category: "transport-mobility",
  },
  {
    trigger: "/keke",
    label: "Book a keke",
    description: "Tricycle ride",
    skill: "keke_driver",
    category: "transport-mobility",
  },
  {
    trigger: "/taxi",
    label: "Book a taxi",
    description: "Regular taxi or ride-hailing",
    skill: "informal_taxi",
    category: "transport-mobility",
  },
  {
    trigger: "/food",
    label: "Order food",
    description: "Find restaurants and order delivery",
    skill: "order_food",
    category: "food-drink",
  },
  {
    trigger: "/remind",
    label: "Set a reminder",
    description: "Create a reminder for later",
    skill: "reminder_set",
    category: "reach-reference",
  },
  {
    trigger: "/fix",
    label: "Fix something",
    description: "Phone, generator, plumbing, electrical",
    skill: "repair",
    category: "repairs-maintenance",
  },
  {
    trigger: "/clean",
    label: "Book cleaning",
    description: "Home or office cleaning service",
    skill: "house_cleaner",
    category: "personal-care",
  },
  {
    trigger: "/haircut",
    label: "Book a haircut",
    description: "Mobile barber or hairdresser",
    skill: "mobile_barber",
    category: "personal-care",
  },
  {
    trigger: "/laundry",
    label: "Laundry service",
    description: "Wash and fold pickup/delivery",
    skill: "laundry_man",
    category: "personal-care",
  },
  {
    trigger: "/tutor",
    label: "Find a tutor",
    description: "Home tutor for any subject",
    skill: "home_tutor",
    category: "education-learning",
  },
  {
    trigger: "/event",
    label: "Book an event",
    description: "MC, DJ, live band, comedian",
    skill: "event_mc",
    category: "events-entertainment",
  },
  {
    trigger: "/doctor",
    label: "Book a doctor",
    description: "Doctor appointment booking",
    skill: "doctor_appointment",
    category: "health-medical",
  },
  {
    trigger: "/medicine",
    label: "Order medicine",
    description: "Pharmacy delivery",
    skill: "medicine_delivery",
    category: "health-medical",
  },
  {
    trigger: "/emergency",
    label: "Emergency help",
    description: "Ambulance, towing, fire, security",
    skill: "emergency",
    category: "emergency-dispatch",
  },
  {
    trigger: "/find",
    label: "Find a worker",
    description: "Plumber, electrician, mechanic, etc.",
    skill: "find_worker",
    category: "repairs-maintenance",
  },
  {
    trigger: "/sell",
    label: "Sell an item",
    description: "List something for sale",
    skill: "sell_item",
    category: "classifieds-marketplace",
  },
  {
    trigger: "/buy",
    label: "Buy something",
    description: "Find products to buy",
    skill: "product_sourcing",
    category: "classifieds-marketplace",
  },
  {
    trigger: "/job",
    label: "Find a job",
    description: "Part-time, gig, or freelance work",
    skill: "find_work",
    category: "gigs-microtasks",
  },
  {
    trigger: "/task",
    label: "Find a task",
    description: "Microtasks to earn from",
    skill: "gigs_microtasks",
    category: "gigs-microtasks",
  },
  {
    trigger: "/promote",
    label: "Promote something",
    description: "Advertise your business",
    skill: "advertising",
    category: "professional-services",
  },
  {
    trigger: "/refer",
    label: "Refer a friend",
    description: "Share Kurukoo and earn",
    skill: "referral",
    category: "community-neighbourhood",
  },
  {
    trigger: "/circle",
    label: "Money circle",
    description: "Create or join a money circle",
    skill: "money_circle",
    category: "money-circle",
  },
  {
    trigger: "/flight",
    label: "Book a flight",
    description: "Flight search and booking",
    skill: "book_flight",
    category: "tourism-travel",
  },
  {
    trigger: "/hotel",
    label: "Book a hotel",
    description: "Hotel or accommodation booking",
    skill: "book_hotel",
    category: "accommodation-lodging",
  },
  {
    trigger: "/ticket",
    label: "Event tickets",
    description: "Buy event tickets",
    skill: "buy_ticket",
    category: "events-entertainment",
  },
  {
    trigger: "/story",
    label: "Tell me a story",
    description: "Entertainment and stories",
    skill: "tell_story",
    category: "reach-reference",
  },
  {
    trigger: "/garri",
    label: "Buy garri/food items",
    description: "Street food and local produce",
    skill: "street_food_cart",
    category: "cravings-streetfood",
  },
  {
    trigger: "/price",
    label: "Check price",
    description: "Price check for any item",
    skill: "price_check",
    category: "price-check",
  },
  {
    trigger: "/track",
    label: "Track order",
    description: "Track your delivery or request",
    skill: "track_order",
    category: "logistics-freight",
  },
  {
    trigger: "/connect",
    label: "Connect storage",
    description: "Google Drive, Notion, OneDrive",
    skill: "connect_storage",
    category: "digital-services",
  },
];

function useTypingPlaceholder(disabled: boolean, active: boolean) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (disabled || active) return;
    const target = placeholderExamples[exampleIndex];
    const delay = deleting ? 32 : typed.length === target.length ? 1500 : 58;
    const timer = window.setTimeout(() => {
      if (!deleting) {
        if (typed.length < target.length) setTyped(target.slice(0, typed.length + 1));
        else setDeleting(true);
      } else if (typed.length > 0) setTyped(typed.slice(0, -1));
      else {
        setDeleting(false);
        setExampleIndex((index) => (index + 1) % placeholderExamples.length);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, deleting, disabled, exampleIndex, typed]);
  return active
    ? "Listening for dictation…"
    : disabled
      ? "Kurukoo is working…"
      : `Ask Kurukoo to ${typed}`;
}
function DictationIndicator() {
  return (
    <span
      className="flex items-end gap-[3px]"
      aria-label="Dictating"
      title="Dictating"
      role="status"
    >
      {["h-2", "h-3.5", "h-5", "h-3"].map((height) => (
        <span
          key={height}
          className={cn("w-[3px] rounded-full bg-primary motion-safe:animate-pulse", height)}
        />
      ))}
    </span>
  );
}
export type ComposerAttachment = { name: string; size: number; mimeType: string };
export type ComposerGeoAttachment = {
  kind: "geolocation";
  latitude: number;
  longitude: number;
  accuracy?: number;
};
export type ComposerOutboundAttachment = ComposerAttachment | ComposerGeoAttachment;
export function Composer({
  onSend,
  placeholder,
  disabled = false,
  initialValue = "",
  voiceOverlayTargetId,
  showLocationAction = true,
  showDictation = true,
  onVoiceStateChange,
  voiceConversationId,
}: {
  onSend: (text: string, attachments?: ComposerOutboundAttachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
  voiceOverlayTargetId?: string;
  showLocationAction?: boolean;
  showDictation?: boolean;
  onVoiceStateChange?: (active: boolean) => void;
  voiceConversationId?: string;
}) {
  const [draft, setDraft] = useState(initialValue);
  const [dictating, setDictating] = useState(false);
  const [dictationAvailable, setDictationAvailable] = useState(false);
  const [files, setFiles] = useState<ComposerAttachment[]>([]);
  const { geo, geoError, locating, shareLocation, clearGeo } = useUserLocation();
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const slashRef = useRef<HTMLDivElement | null>(null);
  const hasText = draft.trim().length > 0;
  const typingPlaceholder = useTypingPlaceholder(
    disabled,
    hasText || dictating || Boolean(placeholder),
  );

  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.trigger.toLowerCase().includes(slashQuery.toLowerCase()) ||
      cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(slashQuery.toLowerCase()),
  );

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    setDraft(cmd.trigger + " ");
    setShowSlashCommands(false);
    setSlashQuery("");
    setSlashIndex(0);
    areaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
        if (showSlashCommands && filteredCommands[slashIndex]) {
          event.preventDefault();
          handleSlashSelect(filteredCommands[slashIndex]);
          return;
        }
        event.preventDefault();
        submit();
        return;
      }
      if (showSlashCommands) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (event.key === "Escape") {
          setShowSlashCommands(false);
          setSlashQuery("");
          setSlashIndex(0);
          return;
        }
      }
      if (event.key === "/" && draft === "") {
        event.preventDefault();
        setShowSlashCommands(true);
        setSlashQuery("");
        setSlashIndex(0);
        return;
      }
    },
    [showSlashCommands, filteredCommands, slashIndex, draft, handleSlashSelect],
  );

  useEffect(() => {
    if (initialValue) setDraft(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 160)}px`;
  }, [draft]);

  useEffect(() => {
    setDictationAvailable(getRecognition() !== null);
    return () => recRef.current?.stop();
  }, []);

  // Click outside to close slash commands
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (slashRef.current && !slashRef.current.contains(event.target as Node)) {
        setShowSlashCommands(false);
        setSlashQuery("");
        setSlashIndex(0);
      }
    }
    if (showSlashCommands) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSlashCommands]);

  const toggleDictation = () => {
    if (disabled || !dictationAvailable) return;
    if (dictating) {
      recRef.current?.stop();
      setDictating(false);
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setDraft(transcript.trimStart());
    };
    rec.onend = () => setDictating(false);
    rec.onerror = () => setDictating(false);
    try {
      rec.start();
      setDictating(true);
    } catch {
      setDictating(false);
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (dictating) {
      recRef.current?.stop();
      setDictating(false);
    }
    // Check for slash command trigger
    const lastSpace = value.lastIndexOf(" ");
    const potentialTrigger = value.slice(lastSpace + 1);
    if (potentialTrigger.startsWith("/") && potentialTrigger.length > 1) {
      setSlashQuery(potentialTrigger.slice(1));
      setShowSlashCommands(true);
      setSlashIndex(0);
    } else if (!potentialTrigger.startsWith("/")) {
      setShowSlashCommands(false);
      setSlashQuery("");
      setSlashIndex(0);
    }
  };
  const submit = () => {
    const clean = draft.trim();
    if (disabled || (!clean && !files.length && !geo)) return;
    const outbound: ComposerOutboundAttachment[] = [...files];
    if (geo) outbound.push(geo);
    onSend(
      clean || (geo ? "Shared my current pickup point." : "Shared a photo with this message."),
      outbound.length ? outbound : undefined,
    );
    setDraft("");
    setFiles([]);
    clearGeo();
  };
  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 3)
      .map((f) => ({ name: f.name.slice(0, 80), size: f.size, mimeType: f.type }));
    if (next.length) setFiles((current) => [...current, ...next].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  };
  const primaryClass = "grid size-10 shrink-0 place-items-center rounded-full transition-colors";
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="relative rounded-[22px] border border-border bg-surface/95 p-2 shadow-[var(--shadow-soft)] backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="ask" className="sr-only">
          Ask Kurukoo
        </label>
        <textarea
          id="ask"
          ref={areaRef}
          rows={1}
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? typingPlaceholder}
          autoComplete="off"
          disabled={disabled}
          aria-label="Ask Kurukoo"
          className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {showSlashCommands && filteredCommands.length > 0 && (
          <div
            ref={slashRef}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 max-h-64 overflow-auto rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)] animate-in fade-in-0 zoom-in-95 duration-150"
            role="listbox"
            aria-label="Slash commands"
          >
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.trigger}
                type="button"
                onClick={() => handleSlashSelect(cmd)}
                onMouseEnter={() => setSlashIndex(index)}
                role="option"
                aria-selected={index === slashIndex}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                  index === slashIndex
                    ? "bg-elevated text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-elevated"
                }`}
              >
                <span className="font-mono text-primary">{cmd.trigger}</span>
                <span className="font-medium">{cmd.label}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{cmd.category}</span>
              </button>
            ))}
            {filteredCommands.length === 0 && (
              <div className="px-3 py-2 text-[13px] text-muted-foreground">No commands match</div>
            )}
          </div>
        )}
        {dictating ? <DictationIndicator /> : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Attach photos"
          disabled={disabled}
          onChange={(event) => pickFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Attach photos for provider context"
          title="Attach photos — they ride along for providers; Kurukoo can't see image contents yet"
          className={cn(
            primaryClass,
            "bg-background text-muted-foreground hover:bg-elevated hover:text-foreground",
          )}
        >
          <Paperclip className="size-[18px]" />
        </button>
        {showLocationAction ? (
          <button
            type="button"
            onClick={shareLocation}
            disabled={disabled || locating}
            aria-label={geo ? "Pickup point shared" : "Share pickup point location"}
            title="Share your current pickup point — coordinates ride along for dispatch; nothing is dispatched yet"
            className={cn(
              primaryClass,
              "bg-background text-muted-foreground hover:bg-elevated hover:text-foreground",
              geo && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            <MapPin className="size-[18px]" />
          </button>
        ) : null}
        {showDictation ? (
          <button
            type="button"
            onClick={toggleDictation}
            disabled={disabled || !dictationAvailable}
            aria-pressed={dictating}
            aria-label={
              disabled
                ? "Kurukoo is working"
                : dictating
                  ? "Stop dictation"
                  : dictationAvailable
                    ? "Dictate into message"
                    : "Dictation is not available in this browser"
            }
            title={
              disabled
                ? "Kurukoo is working"
                : dictating
                  ? "Stop dictation"
                  : dictationAvailable
                    ? "Dictate into message"
                    : "Dictation is not available in this browser"
            }
            className={cn(
              primaryClass,
              "bg-background text-muted-foreground hover:bg-elevated hover:text-foreground",
              dictating && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {dictating ? <Square className="size-4" /> : <Mic className="size-[18px]" />}
          </button>
        ) : null}
        {hasText || files.length || geo ? (
          <button
            type="submit"
            disabled={disabled}
            aria-label="Send"
            title="Send (Enter to send, Shift+Enter for a new line)"
            className={cn(
              primaryClass,
              "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-35",
            )}
          >
            <ArrowUp className="size-[18px]" />
          </button>
        ) : (
          <LiveVoice
            triggerLabel="Hey Kurukoo — voice mode"
            triggerIcon={<AudioLines className="size-[18px]" />}
            triggerClassName="group relative grid size-10 shrink-0 place-items-center rounded-full bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            overlayTargetId={voiceOverlayTargetId}
            onVoiceStateChange={onVoiceStateChange}
            conversationId={voiceConversationId}
          />
        )}
      </div>
      {files.length || geo || geoError || locating ? (
        <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1.5">
          {files.map((f) => (
            <span
              key={`${f.name}-${f.size}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11.5px] text-muted-foreground"
            >
              {f.name}
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((c) => c !== f))}
                aria-label={`Remove ${f.name}`}
                className="grid size-6 place-items-center rounded-full hover:bg-elevated hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <span className="text-[10.5px] text-muted-foreground">
            Photos ride along for providers — Kurukoo can&apos;t see image contents yet.
          </span>
          {geo ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 text-[11.5px] text-foreground">
              Pickup point (±{geo.accuracy ?? "?"}m)
              <button
                type="button"
                onClick={clearGeo}
                aria-label="Remove shared pickup point"
                className="grid size-6 place-items-center rounded-full hover:bg-elevated"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ) : null}
          {locating ? (
            <span className="text-[10.5px] text-muted-foreground">Reading location…</span>
          ) : null}
          {geoError ? (
            <span className="text-[10.5px] text-muted-foreground">{geoError}</span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 flex items-center justify-between px-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Sparkles className="size-3.5" />
          Your Kurukoo
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          You stay in control
          <span aria-hidden="true">·</span>
          {disabled ? "Working" : hasText ? "Ready to send" : "Say “Hey Kurukoo” or type"}
        </span>
      </div>
    </form>
  );
}
