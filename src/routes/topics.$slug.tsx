import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Flag, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { AdSlot } from "@/components/kurukoo/ui";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import {
  fetchCanonicalTopic,
  submitCanonicalReply,
  type CanonicalTopic,
} from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/topics/$slug")({
  head: () => ({
    meta: [
      { title: "Topic — Kurukoo" },
      {
        name: "description",
        content: "Community context, moderated discussion and useful Kurukoo pathways around one subject.",
      },
      { property: "og:title", content: "Topic — Kurukoo" },
      { property: "og:description", content: "Community discussion and context with a clear bridge into Kurukoo." },
    ],
  }),
  component: TopicPage,
});

function pretty(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TopicPage() {
  const { slug } = Route.useParams();
  const { send } = useKurukoo();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<CanonicalTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState("");

  async function loadTopic(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      setTopic(await fetchCanonicalTopic(slug));
      setReplyStatus("");
    } catch (error) {
      setTopic(null);
      setReplyStatus(error instanceof Error ? error.message : "This Topic is unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTopic();
  }, [slug]);

  async function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic || !reply.trim()) return;
    const text = reply.trim();
    if (text.length < 2) return;
    setReplyStatus("Submitting for review…");
    try {
      await submitCanonicalReply(topic.id, text);
      setReply("");
      setReplyStatus("Reply submitted for review. It will appear here after moderation.");
      await loadTopic(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit reply";
      setReplyStatus(message === "Authentication required" ? "Sign in to join the discussion." : message);
    }
  }

  function continueWithKurukoo() {
    if (!topic) return;
    send(`Tell me about the community context around ${topic.title.toLowerCase()}. Help me understand what is useful, what is uncertain, and whether there is a next step I can take.`);
    navigate({ to: "/chat" });
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-[24px] border border-border bg-surface" aria-label="Loading Topic" />;
  }

  if (!topic) {
    return (
      <>
        <PageHeader title="Topic" />
        <EmptyState title="Topic not found" body={replyStatus || "Browse public Topics to find community context."} />
        <Link to="/topics" className="mt-4 inline-flex items-center gap-1.5 text-[14px] underline">
          <ArrowLeft className="size-3.5" /> All Topics
        </Link>
      </>
    );
  }

  const locality = [topic.city, topic.lga].filter(Boolean).join(" · ");

  return (
    <div className="w-full max-w-4xl">
      <Link to="/topics" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Topics
      </Link>

      <section className="mt-4 max-w-3xl">
        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-elevated px-2 py-1 font-medium text-foreground/80">{pretty(topic.type)}</span>
          {topic.category ? <span className="rounded-full bg-elevated px-2 py-1">{pretty(topic.category)}</span> : null}
          {locality ? <span className="rounded-full bg-elevated px-2 py-1">{locality}</span> : null}
        </div>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.04] tracking-[-0.045em] md:text-[52px]">{topic.title}</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
          Shared by {topic.authorLabel}. This is community context: it can help you understand a situation, but it does not verify providers, prices, stock, availability, booking, payment or delivery.
        </p>
      </section>

      <section className="mt-6 rounded-[20px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated"><ShieldCheck className="size-4" /></span>
          <div>
            <p className="text-[13px] font-medium">Community context, not fulfilment proof</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">Use the discussion to learn what people are saying. Ask Kurukoo when you need evidence, current options or an actual next step.</p>
          </div>
        </div>
        <button type="button" onClick={continueWithKurukoo} className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90">
          Discuss with Kurukoo <ArrowUpRight className="size-3.5" />
        </button>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">Community discussion</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">What people are saying</h2>
          </div>
          <button type="button" onClick={() => void loadTopic(true)} disabled={refreshing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12px] text-muted-foreground hover:bg-elevated disabled:opacity-50">
            <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
          </button>
        </div>

        <div className="space-y-3">
          {topic.body ? (
            <article className="rounded-[18px] border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground"><MessageCircle className="size-3.5" /> Topic statement · {topic.authorLabel}</div>
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed">{topic.body}</p>
              <p className="mt-3 text-[11.5px] text-muted-foreground">Community statement · not independently verified</p>
            </article>
          ) : null}

          {topic.replies?.length ? topic.replies.map((item) => (
            <article key={item.id} className="rounded-[18px] border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground"><MessageCircle className="size-3.5" /> {item.authorLabel}</div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed">{item.body}</p>
              <p className="mt-3 text-[11.5px] text-muted-foreground">Moderated reply · community context</p>
            </article>
          )) : (
            <div className="rounded-[18px] border border-dashed border-border p-5 text-[13px] text-muted-foreground">No moderated replies yet. This stays quiet rather than being padded with synthetic activity.</div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">Add useful context</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Replies are reviewed before they become public. Do not post private contact details, precise addresses or unsupported claims.</p>
          </div>
        </div>
        <form onSubmit={handleReply} className="mt-4">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="What have you learned, experienced or discovered?"
            className="w-full resize-y rounded-xl border border-border bg-background p-3 text-[13px] outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            aria-label="Add useful context"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11.5px] text-muted-foreground" aria-live="polite">{replyStatus}</span>
            <button type="submit" disabled={!reply.trim()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[12.5px] font-medium hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50">
              Submit reply for review <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </form>
        <button type="button" className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"><Flag className="size-3.5" /> Report something that needs review</button>
      </section>

      {topic.relatedResources?.length ? (
        <section className="mt-8">
          <div className="mb-3"><p className="text-[12px] font-medium text-muted-foreground">Editorial context</p><h2 className="mt-1 text-[20px] font-semibold tracking-tight">Related Kurukoo resources</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topic.relatedResources.map((resource) => (
              <Link key={resource.slug} to="/resources" className="group rounded-[18px] border border-border bg-surface p-4 hover:bg-elevated/50">
                <p className="text-[14px] font-medium">{resource.title}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Linked by Kurukoo editorial review. This resource does not independently verify the Topic statement.</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <AdSlot
          placement="Topic feed"
          headline="Relevant sponsored discovery"
          body="Sponsored placements stay visually separate from community discussion and are not evidence of availability."
          advertiser="Sponsored placement"
        />
      </div>

      <IntegrationGap>
        Topic discussion is community context. Kurukoo's verified discovery and fulfilment layers remain the source of truth for real-world action.
      </IntegrationGap>
    </div>
  );
}
