import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, Info, Save, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import {
  fetchTopicSuggestions,
  topicApiConfigured,
  type OwnerTopic,
  type TopicInput,
  type TopicSuggestion,
  typeGuidance,
} from "@/lib/topic-lifecycle";
import { fetchTopicTaxonomy, type TopicTaxonomy } from "@/lib/kurukoo-api";
import { cn } from "@/lib/utils";

type EditorMode = "create" | "edit";
type TopicEditorProps = {
  mode: EditorMode;
  initialTopic?: OwnerTopic | null;
  onSaved: (topic: OwnerTopic, action: "draft" | "submitted") => void;
  onCancel: () => void;
  saveDraft?: (input: TopicInput) => Promise<OwnerTopic>;
  submit: (input: TopicInput) => Promise<OwnerTopic>;
};
const FALLBACK_TYPES = [
  "question",
  "opinion",
  "guide",
  "review",
  "local_report",
  "price_report",
  "recommendation",
  "meme",
  "poll",
  "event",
  "alert",
  "opportunity",
  "experience",
];
function pretty(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function isAuthError(error: unknown) {
  return error instanceof Error && error.message === "Authentication required";
}

export function TopicEditor({
  mode,
  initialTopic,
  onSaved,
  onCancel,
  saveDraft,
  submit,
}: TopicEditorProps) {
  const [taxonomy, setTaxonomy] = useState<TopicTaxonomy>({
    types: FALLBACK_TYPES,
    categories: [],
    skillsByCategory: {},
  });
  const [title, setTitle] = useState(initialTopic?.title ?? "");
  const [body, setBody] = useState(initialTopic?.body ?? "");
  const [type, setType] = useState(initialTopic?.type ?? "question");
  const [category, setCategory] = useState(initialTopic?.category ?? "");
  const [skills, setSkills] = useState<string[]>(initialTopic?.skills ?? []);
  const [city, setCity] = useState(initialTopic?.city ?? "");
  const [lga, setLga] = useState(initialTopic?.lga ?? "");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitKind, setSubmitKind] = useState<"draft" | "submitted" | null>(null);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    void fetchTopicTaxonomy()
      .then((next) => {
        setTaxonomy(next);
        if (!initialTopic) {
          setType((current) => current || next.types[0] || "question");
          setCategory((current) => current || next.categories[0] || "");
        }
      })
      .catch(() => undefined);
  }, [initialTopic]);
  const availableSkills = useMemo(
    () => taxonomy.skillsByCategory[category] ?? [],
    [category, taxonomy.skillsByCategory],
  );
  useEffect(
    () => setSkills((current) => current.filter((skill) => availableSkills.includes(skill))),
    [availableSkills],
  );
  useEffect(() => {
    if (!topicApiConfigured()) return undefined;
    const cleanTitle = title.trim();
    if (cleanTitle.length < 12) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSuggestionsLoading(true);
      void fetchTopicSuggestions(cleanTitle, category || undefined)
        .then((next) => {
          if (!cancelled) setSuggestions(next.slice(0, 4));
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setSuggestionsLoading(false);
        });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title, category]);
  function toggleSkill(skill: string) {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : current.length >= 3
          ? current
          : [...current, skill],
    );
  }
  const guidance = typeGuidance(type);
  const isPoll = type === "poll";
  const isAlert = type === "alert";
  const ready = title.trim().length >= 12 && body.trim().length >= 30 && Boolean(type) && agreed;
  const input: TopicInput = {
    title: title.trim(),
    body: body.trim(),
    type,
    ...(category ? { category } : {}),
    ...(skills.length ? { skills } : {}),
    ...(city.trim() ? { city: city.trim() } : {}),
    ...(lga.trim() ? { lga: lga.trim() } : {}),
  };
  async function handleAction(event: FormEvent, action: "draft" | "submitted") {
    event.preventDefault();
    setError("");
    setAuthRequired(false);
    if (!topicApiConfigured()) {
      setError(
        "Topic creation is connected to Kurukoo's canonical Topic service, but this environment has no backend URL configured yet.",
      );
      return;
    }
    if (title.trim().length < 12 || body.trim().length < 30) {
      setError(
        "The canonical Topic service requires a title of at least 12 characters and body of at least 30 characters, even for drafts.",
      );
      return;
    }
    if (action === "submitted" && !agreed) {
      setError("Confirm the content acknowledgement before submitting this Topic.");
      return;
    }
    setSaving(true);
    setSubmitKind(action);
    try {
      const topic = action === "draft" ? await saveDraft!(input) : await submit(input);
      onSaved(topic, action);
    } catch (nextError) {
      if (isAuthError(nextError)) {
        setAuthRequired(true);
        setError(
          "Sign in to save or submit a Topic. You can return to this flow after authentication.",
        );
      } else
        setError(
          nextError instanceof Error ? nextError.message : "Topic could not be saved right now.",
        );
    } finally {
      setSaving(false);
      setSubmitKind(null);
    }
  }

  return (
    <form onSubmit={(event) => void handleAction(event, "submitted")} className="mt-8 space-y-5">
      <Panel className="p-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="topic-title" className="text-[12.5px] font-medium">
              Title
            </label>
            <input
              id="topic-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              placeholder="What do you want people to discuss?"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[14px] outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-muted-foreground">
              <span>At least 12 characters</span>
              <span>{title.length}/160</span>
            </div>
          </div>
          {suggestionsLoading || suggestions.length ? (
            <div className="rounded-xl border border-border bg-elevated/50 p-3.5">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">There are already Topics about this</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    See related discussions before starting another public record. You can still
                    continue creating this Topic.
                  </p>
                  {suggestionsLoading ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Checking related Topics…
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {suggestions.map((item) => (
                        <Link
                          key={item.id}
                          to="/topics/$slug"
                          params={{ slug: item.slug }}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-background"
                        >
                          <span className="truncate text-[11.5px] font-medium">{item.title}</span>
                          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      ))}
                      <span className="mt-1 inline-flex text-[10.5px] text-muted-foreground">
                        Continue creating remains available below.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <div>
            <label htmlFor="topic-body" className="text-[12.5px] font-medium">
              What would you like to share?
            </label>
            <textarea
              id="topic-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={8}
              maxLength={8000}
              placeholder="Give people enough context to understand the question, experience, report or idea."
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3.5 text-[13.5px] leading-relaxed outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-muted-foreground">
              <span>At least 30 characters</span>
              <span>{body.length}/8000</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="topic-type" className="text-[12.5px] font-medium">
                Topic type
              </label>
              <select
                id="topic-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none"
              >
                {taxonomy.types.map((item) => (
                  <option key={item} value={item}>
                    {pretty(item)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topic-category" className="text-[12.5px] font-medium">
                Category <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <select
                id="topic-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none"
              >
                <option value="">No category</option>
                {taxonomy.categories.map((item) => (
                  <option key={item} value={item}>
                    {pretty(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background px-3.5 py-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-[12px] leading-relaxed text-muted-foreground">{guidance}</p>
            </div>
            {isPoll ? (
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                Voting is not enabled because the canonical Topic service does not currently expose
                vote persistence. No client-only vote counts are shown.
              </p>
            ) : null}
            {isAlert ? (
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                For alerts, clearly separate urgent safety information from anything you have not
                independently verified.
              </p>
            ) : null}
          </div>
          {availableSkills.length ? (
            <div>
              <p className="text-[12.5px] font-medium">Existing Kurukoo skills</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use up to three skills already recognised by Kurukoo.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "rounded-full border px-2.5 py-1.5 text-[11.5px] transition-colors",
                      skills.includes(skill)
                        ? "border-primary/40 bg-elevated text-foreground"
                        : "border-border text-muted-foreground hover:bg-elevated",
                    )}
                  >
                    {pretty(skill)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12.5px] font-medium">Location</p>
              <button
                type="button"
                onClick={() => {
                  setCity("");
                  setLga("");
                }}
                className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
                Remove location
              </button>
            </div>
            <div className="rounded-xl border border-border bg-elevated/40 p-3">
              <p className="text-[11px] text-muted-foreground">
                Public Topic · everyone may be able to see this after approval. Use city or local
                area only. Never add precise addresses, coordinates, credentials or private contact
                details.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="topic-city" className="text-[11.5px] font-medium">
                    City
                  </label>
                  <input
                    id="topic-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    maxLength={80}
                    placeholder="e.g. Lagos"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[12.5px] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="topic-lga" className="text-[11.5px] font-medium">
                    Local area / LGA
                  </label>
                  <input
                    id="topic-lga"
                    value={lga}
                    onChange={(event) => setLga(event.target.value)}
                    maxLength={80}
                    placeholder="e.g. Yaba"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[12.5px] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
      <Panel className="p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-[13px] font-medium">Before you submit</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Confirm that you have the right to share this content and understand that it may
              become publicly visible after moderation. Do not include private contact details,
              precise addresses, credentials or unsupported claims.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11.5px]">
              <Link to="/help" className="inline-flex items-center gap-1 underline">
                Community guidance <ExternalLink className="size-3" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-1 underline">
                Kurukoo information <ExternalLink className="size-3" />
              </Link>
              <span className="text-muted-foreground">
                Use the current Kurukoo policies for the full legal terms.
              </span>
            </div>
          </div>
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-background p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 size-4 rounded border-border"
          />
          <span className="text-[12px] leading-relaxed">
            I confirm I have the right to share this content and understand it may become public
            after moderation.
          </span>
        </label>
      </Panel>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-border bg-elevated/60 px-4 py-3 text-[12.5px] leading-relaxed"
        >
          {error}
          {authRequired ? (
            <span className="mt-2 block">
              <Link to="/login" className="font-medium underline">
                Sign in to continue
              </Link>
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {mode === "create" && saveDraft ? (
          <button
            type="button"
            onClick={(event) => void handleAction(event as unknown as FormEvent, "draft")}
            disabled={saving || title.trim().length < 12 || body.trim().length < 30}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[13px] font-medium hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            {submitKind === "draft" ? "Saving…" : "Save draft"}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={saving || !ready}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
          {submitKind === "submitted"
            ? "Submitting…"
            : mode === "edit"
              ? "Save & submit for review"
              : "Submit for review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-10 items-center px-3 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        {mode === "edit" ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="size-3.5" />
            Changes go through moderation
          </span>
        ) : null}
      </div>
    </form>
  );
}
