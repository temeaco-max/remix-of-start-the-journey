import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  Globe,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Message as MessageModel, WorkItem, WorkStage } from "@/lib/kurukoo-store";

export const stageLabel: Record<WorkStage, string> = {
  understanding: "Getting started",
  working: "In progress",
  needs_you: "Needs you",
  done: "Done",
};
/** Commercial Daily Pick advert surfaced as an agent in-chat message.
 * Renders only the canonical advert fields the turn actually supplied
 * (evidence-bound, provenance-bound). It never invents price, stock,
 * availability, provider acceptance, placement, or fulfilment, and it
 * never claims an order or payment was made. */
export function DailyPickAdCard({
  advert,
  onOrder,
  onAsk,
}: {
  advert: {
    title?: string | null;
    description?: string | null;
    category?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
    created_at?: string | null;
    price?: string | null;
    creditReward?: number | null;
  };
  onOrder?: () => void;
  onAsk?: (prompt: string) => void;
}) {
  const validUrl = /^https?:\/\//i.test(String(advert.ctaLink || ""));
  const evidence = {
    category: advert.category || null,
    url: validUrl ? advert.ctaLink : null,
    published: advert.created_at || null,
    price: advert.price || null,
    reward: typeof advert.creditReward === "number" ? `+${advert.creditReward} credit` : null,
    provenance: "canonical-daily-pick",
  };
  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <p className="text-[15.5px] font-medium text-foreground">
            {advert.title || "Today's pick"}
          </p>
          {advert.description ? (
            <p className="mt-1 text-[14px] text-muted-foreground">{advert.description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {advert.ctaText ? (
          <button
            type="button"
            onClick={() => void onOrder?.()}
            className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {advert.ctaText}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onOrder?.()}
            className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Order this
          </button>
        )}
        <button
          type="button"
          onClick={() => void onAsk?.("Tell me more about this pick before I decide")}
          className="rounded-full border border-border px-3.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-elevated"
        >
          Ask about this first
        </button>
      </div>
      <DataList
        data={evidence}
        keys={["category", "url", "published", "price", "reward", "provenance"]}
      />
    </div>
  );
}
const stageConfig = {
  understanding: "Getting started",
  working: "In progress",
  needs_you: "Needs you",
  done: "Done",
};

export function Status({ stage }: { stage: WorkStage }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]",
        stage === "needs_you"
          ? "bg-accent text-accent-foreground"
          : "bg-elevated text-muted-foreground",
      )}
    >
      {stage !== "done" ? (
        <span className="size-1.5 rounded-full bg-current opacity-70 motion-safe:animate-pulse" />
      ) : (
        <Check className="size-3" strokeWidth={3} />
      )}
      {stageLabel[stage]}
    </span>
  );
}

function readableLabel(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "";
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function hrefFor(data: Record<string, unknown>, fallback = "/work") {
  const id = text(data.requestId ?? data.workId ?? data.id);
  return id ? `/work/${encodeURIComponent(id)}` : fallback;
}
function CardAction({
  label,
  href,
  onClick,
  primary = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const className = cn(
    "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-medium transition-colors",
    primary
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border border-border hover:bg-elevated",
  );
  if (href)
    return (
      <Link to={href as never} className={className}>
        {label}
        <ChevronRight className="size-3.5" />
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
      <ChevronRight className="size-3.5" />
    </button>
  );
}
function Shell({
  icon,
  title,
  body,
  children,
  tone = "surface",
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  children?: ReactNode;
  tone?: "surface" | "tint" | "danger";
}) {
  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border p-4 shadow-[var(--shadow-soft)]",
        tone === "tint"
          ? "border-primary/20 bg-brand-tint/15"
          : tone === "danger"
            ? "border-destructive/20 bg-destructive/5"
            : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[12px] font-semibold">{title}</p>
      </div>
      {body ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
function DataList({ data, keys }: { data: Record<string, unknown>; keys: string[] }) {
  const entries = keys
    .filter((key) => data[key] !== undefined && data[key] !== null && String(data[key]).trim())
    .slice(0, 6);
  if (!entries.length) return null;
  return (
    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
      {entries.map((key) => (
        <div key={key} className="rounded-xl bg-elevated/60 px-3 py-2">
          <dt className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {readableLabel(key)}
          </dt>
          <dd className="mt-0.5 truncate text-[11.5px]">
            {typeof data[key] === "object" ? JSON.stringify(data[key]) : String(data[key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
/** Editable form packet: prefilled values render with provenance chips;
 * blanks stay blank. Submit sends exactly what the user confirmed. */
function FormFields({
  schemaId,
  fields,
  onSubmit,
}: {
  schemaId: string;
  fields: Record<string, unknown>[];
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const key = String(field.key);
      if (typeof field.value === "string" && field.value.trim()) initial[key] = field.value;
    }
    return initial;
  });
  const [filing, setFiling] = useState(false);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  return (
    <div className="grid gap-2">
      {fields.map((field) => {
        const key = String(field.key);
        const provenance = String(field.provenance || "blank");
        return (
          <label key={key} className="block">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              {String(field.label || key)}
              {field.required ? <span className="text-destructive">*</span> : null}
              <span className="font-normal text-muted-foreground">
                {provenance === "memory_profile"
                  ? "· from your profile"
                  : provenance === "user_supplied"
                    ? "· you supplied"
                    : "· blank"}
              </span>
            </span>
            <input
              value={values[key] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [key]: event.target.value }))
              }
              aria-label={String(field.label || key)}
              autoComplete="off"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        );
      })}
      <div className="mt-1">
        <CardAction
          label={filing ? "Filing…" : "Review and file"}
          primary
          onClick={() => {
            if (filing) return;
            setFiling(true);
            try {
              onSubmit(values);
            } finally {
              window.setTimeout(() => {
                if (mountedRef.current) setFiling(false);
              }, 2000);
            }
          }}
        />
      </div>
    </div>
  );
}
import { ToolActivityTranscript } from "@/components/kurukoo/tool-activity";
function ChatCard({
  data,
  onAction,
  onCartAdd,
  onAdvance,
  onOfferSelect,
  onReview,
  onEmailSend,
  onFormSubmit,
}: {
  data: Record<string, unknown>;
  onAction?: (text: string) => void;
  onCartAdd?: (offerId: string, kind?: "offer" | "catalogue") => void;
  onAdvance?: (requestId: string, actionId: string) => void;
  onOfferSelect?: (fulfilmentId: string, offerId: string) => void;
  onReview?: (requestId: string, providerPhone: string, rating: number) => void;
  onEmailSend?: (draft: { to: string; subject: string; body: string }) => void;
  onFormSubmit?: (schemaId: string, values: Record<string, string>) => void;
}) {
  const type = text(data.type).toLowerCase();
  if (type === "semantic_conversation" || data.hidden) return null;
  const options = Array.isArray(data.options)
    ? data.options.filter((v): v is string => typeof v === "string").slice(0, 8)
    : [];
  const actionText = text(data.actionText ?? data.action ?? data.canonicalAction);
  const title = text(
    data.title ?? data.label ?? data.name,
    readableLabel(type) || "Kurukoo update",
  );
  const body = text(data.body ?? data.description ?? data.message ?? data.subtitle);
  if (
    [
      "action",
      "contextual_action",
      "actions",
      "quick_replies",
      "choice",
      "choices",
      "welcome",
    ].includes(type)
  )
    return (
      <Shell icon={<Zap className="size-4 text-primary" />} title={title} body={body}>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <CardAction
              key={option}
              label={option}
              onClick={() => onAction?.(option)}
              primary={Boolean(data.primaryAction === option)}
            />
          ))}
          {actionText && !options.includes(actionText) ? (
            <CardAction label={actionText} onClick={() => onAction?.(actionText)} primary />
          ) : null}
        </div>
      </Shell>
    );
  if (["provider", "provider_match", "provider_card"].includes(type))
    return (
      <Shell
        icon={<Users className="size-4 text-primary" />}
        title={title || "Provider"}
        body={
          body ||
          "Provider context returned by Kurukoo. Availability is only confirmed when connected evidence says it is available."
        }
      >
        <DataList
          data={data}
          keys={[
            "provider",
            "providerName",
            "skill",
            "category",
            "location",
            "availability",
            "evidence",
            "freshness",
            "liveNow",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction label="Review request" href={hrefFor(data)} primary />
          <CardAction
            label="Continue in Chat"
            onClick={() => onAction?.("Continue with this provider option")}
          />
        </div>
      </Shell>
    );
  if (
    ["product", "product_card", "agentic_storefront"].includes(type) &&
    !(type === "product_card" && Array.isArray(data.products) && data.products.length > 0)
  )
    return (
      <Shell
        icon={<ShoppingBag className="size-4 text-primary" />}
        title={title || "Product"}
        body={
          body ||
          "Product context returned by Kurukoo. Review seller, price and availability before ordering."
        }
      >
        {text(data.image ?? data.imageUrl) ? (
          <img
            src={text(data.image ?? data.imageUrl)}
            alt=""
            className="mt-3 h-32 w-full rounded-xl object-cover"
          />
        ) : null}
        <DataList
          data={data}
          keys={[
            "seller",
            "sellerName",
            "price",
            "currency",
            "availability",
            "quantity",
            "delivery",
            "collection",
            "evidence",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {type === "agentic_storefront" &&
          Array.isArray(data.actions) &&
          data.actions.length &&
          onAdvance ? (
            (data.actions as Array<{ id?: unknown; label?: unknown; style?: unknown }>)
              .filter(
                (a): a is { id: string; label: string; style?: string } =>
                  !!a &&
                  typeof a.id === "string" &&
                  !!a.id &&
                  typeof a.label === "string" &&
                  !!a.label,
              )
              .map((a) => (
                <CardAction
                  key={a.id}
                  label={a.label}
                  primary={a.style === "primary"}
                  onClick={() => {
                    const requestId = text(data.requestId);
                    if (requestId) onAdvance(requestId, a.id);
                  }}
                />
              ))
          ) : (
            <>
              <CardAction
                label="Add to request"
                onClick={() => onAction?.("Add this product to my request")}
                primary
              />
              <CardAction label="Compare" onClick={() => onAction?.("Compare this option")} />
              <CardAction label="Save" onClick={() => onAction?.("Save this product")} />
            </>
          )}
        </div>
      </Shell>
    );
  if (["offer", "seller_offer", "offer_card", "quote", "quote_card"].includes(type))
    return (
      <Shell
        icon={<ShoppingBag className="size-4 text-primary" />}
        title={type.includes("quote") ? "Quote" : "Offer"}
        body={
          body ||
          "Commercial terms returned by the canonical service. Nothing is committed until you approve."
        }
        tone="tint"
      >
        <DataList
          data={data}
          keys={[
            "seller",
            "provider",
            "price",
            "amount",
            "currency",
            "discount",
            "validUntil",
            "availability",
            "delivery",
            "collection",
            "terms",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Review and approve"
            onClick={() => onAction?.("Review this quote and tell me what I need to approve")}
            primary
          />
          <CardAction label="Ask a question" onClick={() => onAction?.("Ask about this offer")} />
          {text(data.offerId) && onCartAdd ? (
            <CardAction label="Add to review cart" onClick={() => onCartAdd(text(data.offerId))} />
          ) : null}
        </div>
      </Shell>
    );
  if (type === "product_card") {
    const products = Array.isArray(data.products)
      ? (data.products as Array<Record<string, unknown>>)
      : [];
    if (!products.length) return null;
    return (
      <Shell
        icon={<ShoppingBag className="size-4 text-primary" />}
        title="Products"
        body={
          body ||
          "From verified catalogue sources. Prices are source-declared and confirmed at the destination — Kurukoo has not taken payment."
        }
        tone="tint"
      >
        <div className="mt-2 space-y-2">
          {products.map((product, index) => (
            <div
              key={text(product.id) || String(index)}
              className="rounded-lg border border-border p-2"
            >
              <p className="font-medium">{text(product.title, "Untitled product")}</p>
              <p className="text-muted-foreground">
                {[
                  text(product.sourceLabel) || "Catalogue source",
                  product.price != null
                    ? `${Number(product.price).toLocaleString()} ${text(product.currency)}`.trim()
                    : "",
                  text(product.location),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {text(product.sourceUrl) ? (
                <a
                  href={text(product.sourceUrl)}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="underline"
                >
                  Open destination ↗
                </a>
              ) : null}
              {text(product.id) && onCartAdd ? (
                <div className="mt-2">
                  <CardAction
                    label="Add to review cart"
                    onClick={() => onCartAdd(text(product.id), "catalogue")}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Ask a question"
            onClick={() => onAction?.("Ask about these products")}
          />
        </div>
      </Shell>
    );
  }
  if (
    [
      "request",
      "request_status",
      "status_chip",
      "status",
      "execution",
      "execution_status",
    ].includes(type) ||
    typeof data.status === "string" ||
    typeof data.stage === "string"
  )
    return (
      <Shell
        icon={<Clock3 className="size-4 text-primary" />}
        title={title || "Request status"}
        body={body || "This status is linked to the current request."}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-elevated px-2.5 py-1 text-[10.5px] font-medium">
            {readableLabel(data.status ?? data.stage) || "In progress"}
          </span>
          {text(data.eta) ? (
            <span className="text-[11px] text-muted-foreground">ETA {text(data.eta)}</span>
          ) : null}
        </div>
        <DataList
          data={data}
          keys={["requestId", "skill", "provider", "location", "eta", "updatedAt", "evidence"]}
        />
        <div className="mt-3">
          <CardAction label="Open request" href={hrefFor(data)} primary />
        </div>
      </Shell>
    );
  if (["progress", "diagnostics", "diagnostic", "loading"].includes(type))
    return (
      <Shell
        icon={<LoaderCircle className="size-4 animate-spin text-primary" />}
        title={title || "Working"}
        body={body || "Kurukoo is checking supported state. This may take a moment."}
      >
        <DataList data={data} keys={["step", "stage", "progress", "requestId"]} />
      </Shell>
    );
  if (["payment", "payment_state", "approval", "approval_state"].includes(type))
    return (
      <Shell
        icon={<ShieldCheck className="size-4 text-primary" />}
        title={title || "Approval"}
        body={
          body ||
          "A consequential payment or approval step is ready. Kurukoo will not commit it without your approval."
        }
        tone="tint"
      >
        <DataList
          data={data}
          keys={[
            "status",
            "amount",
            "currency",
            "paymentMethod",
            "authorisation",
            "escrow",
            "refund",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction label="Review" href={hrefFor(data, "/wallet")} primary />
          <CardAction
            label="Ask Kurukoo"
            onClick={() => onAction?.("Explain what I am approving")}
          />
        </div>
      </Shell>
    );
  if (["delivery", "dispatch", "delivery_status", "dispatch_status"].includes(type))
    return (
      <Shell
        icon={<Truck className="size-4 text-primary" />}
        title={title || "Delivery"}
        body={body || "Delivery state returned by the connected fulfilment service."}
      >
        <DataList
          data={data}
          keys={[
            "status",
            "provider",
            "rider",
            "eta",
            "pickup",
            "destination",
            "tracking",
            "evidence",
          ]}
        />
        <div className="mt-3">
          <CardAction label="Open request" href={hrefFor(data)} primary />
        </div>
      </Shell>
    );
  if (["evidence", "result", "evidence_result", "outcome"].includes(type))
    return (
      <Shell
        icon={<FileCheck2 className="size-4 text-primary" />}
        title={title || "Result"}
        body={body || "Evidence returned by the canonical service."}
      >
        <DataList
          data={data}
          keys={["evidence", "source", "verifiedAt", "result", "outcome", "artifactId"]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction label="Open request" href={hrefFor(data)} primary />
          <CardAction
            label="Keep this result"
            onClick={() => onAction?.("Save this result to my context")}
          />
        </div>
      </Shell>
    );
  if (["topic", "topic_card"].includes(type))
    return (
      <Shell
        icon={<MessageCircle className="size-4 text-primary" />}
        title={title || "Topic"}
        body={body || "Community context. It can inform a request but is not fulfilment proof."}
      >
        <DataList data={data} keys={["category", "type", "location", "replyCount", "provenance"]} />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Discuss in Chat"
            onClick={() => onAction?.(`Use this Topic as context: ${title}`)}
            primary
          />
        </div>
      </Shell>
    );
  if (["opportunity", "opportunity_card"].includes(type))
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Opportunity"}
        body={body}
      >
        <DataList data={data} keys={["location", "category", "status", "createdAt", "source"]} />
        <div className="mt-3">
          <CardAction
            label={text(data.ctaText, "Explore opportunity")}
            href={text(data.ctaLink) || hrefFor(data, "/explore")}
            primary
          />
        </div>
      </Shell>
    );
  if (["memory", "memory_card", "memory_action"].includes(type))
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Saved context"}
        body={body || "Owner-scoped context Kurukoo can use when appropriate."}
      >
        <DataList
          data={data}
          keys={["field", "value", "source", "confidence", "observedAt", "expiresAt"]}
        />
        <div className="mt-3">
          <CardAction label="Review memory" href="/memory" primary />
        </div>
      </Shell>
    );
  if (["agent", "agent_goal", "agent_goal_card"].includes(type))
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Agent goal"}
        body={body || "A bounded follow-up goal running with your controls."}
      >
        <DataList
          data={data}
          keys={["status", "goal", "schedule", "attention", "conversationId"]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction label="Open Agent goals" href="/agents" primary />
          <CardAction
            label="Continue in Chat"
            onClick={() => onAction?.("Continue this agent goal")}
          />
        </div>
      </Shell>
    );
  if (["error", "recovery", "failed"].includes(type) || data.error)
    return (
      <Shell
        icon={<ShieldCheck className="size-4 text-destructive" />}
        title={title || "Needs attention"}
        body={body || text(data.error, "Kurukoo could not complete the last step.")}
        tone="danger"
      >
        <div className="flex flex-wrap gap-2">
          <CardAction
            label="Try again"
            onClick={() => onAction?.(text(data.retryText, "Try that again"))}
            primary
          />
          <CardAction
            label="Ask for another route"
            onClick={() => onAction?.("Suggest another way to complete this")}
          />
        </div>
      </Shell>
    );
  if (type === "referral")
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title="Referral"
        body={body || "Continue through the canonical referral surface."}
      >
        <CardAction label="Open referral" href={text(data.destination, "/explore")} primary />
      </Shell>
    );
  if (
    [
      "external_content",
      "external_browse",
      "browse_result",
      "web_content",
      "external_browse_result",
      "capability_external_content",
    ].includes(type)
  )
    return (
      <Shell
        icon={<Globe className="size-4 text-primary" />}
        title={title || "External content"}
        body={
          body ||
          "Content returned by an external/browsed source. Kurukoo reports what the referenced source actually returned; it does not invent availability, price, stock, provider, or fulfilment."
        }
      >
        <DataList
          data={data}
          keys={[
            "label",
            "url",
            "source",
            "siteName",
            "title",
            "description",
            "image",
            "fetchTime",
            "evidence",
            "provenance",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Open in Kurukoo Explore"
            href={
              text(data.url) ? `/explore?src=${encodeURIComponent(text(data.url))}` : "/explore"
            }
            primary
          />
          <CardAction
            label="Bring this into my request"
            onClick={() =>
              onAction?.(
                `Use the external content returned here as context for what I need. Do not commit, price, order, or dispatch anything yet.`,
              )
            }
          />
        </div>
      </Shell>
    );
  if (
    [
      "daily_pick",
      "daily_pick_card",
      "pick",
      "pick_card",
      "todays_pick",
      "recommendation_pick",
    ].includes(type)
  )
    return (
      <DailyPickAdCard
        advert={{
          title: text(data.title),
          description: text(data.description ?? data.reason),
          category: text(data.category),
          ctaText: text(data.ctaText),
          ctaLink: text(data.ctaLink ?? data.url),
          created_at: text(data.created_at ?? data.publishedAt),
          price: text(data.price),
          creditReward: typeof data.creditReward === "number" ? data.creditReward : null,
        }}
        onOrder={() =>
          onAction?.(
            `I want to follow up on this pick: ${title}. Check what is actually available through the canonical request path before committing to anything. Do not invent price, stock, provider, or fulfilment.`,
          )
        }
        onAsk={(prompt) => onAction?.(prompt)}
      />
    );
  if (
    [
      "tool",
      "tool_call",
      "tool_result",
      "capability",
      "capability_result",
      "skill_use",
      "function_call",
    ].includes(type)
  )
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Checked a capability"}
        body={
          body ||
          "Kurukoo consulted a capability while answering. Only the returned evidence is shown; nothing was committed."
        }
      >
        <DataList
          data={data}
          keys={[
            "capability",
            "action",
            "tool",
            "skill",
            "status",
            "evidenceLevel",
            "externalActivation",
            "canonicalObjectId",
            "contextId",
            "message",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Use this in my request"
            onClick={() =>
              onAction?.(
                `Use the capability result shown here as context. Do not commit, price, order, or dispatch anything yet.`,
              )
            }
            primary
          />
        </div>
      </Shell>
    );
  if (["knowledge", "knowledge_result", "knowledge_card", "retrieval_result"].includes(type)) {
    const hits = Array.isArray(data.hits)
      ? data.hits
          .filter(
            (h): h is Record<string, unknown> =>
              !!h &&
              typeof h === "object" &&
              typeof (h as Record<string, unknown>).excerpt === "string",
          )
          .slice(0, 3)
      : [];
    if (!hits.length) return null;
    return (
      <Shell
        icon={<MessageCircle className="size-4 text-primary" />}
        title={title || "From Kurukoo knowledge"}
        body={
          body ||
          "Related entries from Kurukoo's own catalogue, topics, provider evidence, or your saved artifacts. Shown as found; nothing here is a booking, price, or fulfilment promise."
        }
      >
        <div className="grid gap-2">
          {hits.map((h, i) => (
            <div key={String(h.reference || i)} className="rounded-xl bg-elevated/60 px-3 py-2">
              <p className="text-[11.5px] font-medium">
                {text(h.title, readableLabel(h.source) || "Entry")}
              </p>
              <p className="mt-0.5 line-clamp-3 text-[11.5px] text-muted-foreground">
                {String(h.excerpt)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Use this as context"
            onClick={() => onAction?.(`Use the knowledge entries shown here as context.`)}
            primary
          />
        </div>
      </Shell>
    );
  }
  if (["dispute", "dispute_confirm", "dispute_open"].includes(type))
    return (
      <Shell
        icon={<ShieldCheck className="size-4 text-primary" />}
        title={title || "Dispute recorded"}
        body={
          body ||
          "Completion is paused until review. No fault has been assigned and no funds have moved."
        }
        tone="tint"
      >
        <DataList data={data} keys={["requestId", "status", "reason", "openedAt", "evidence"]} />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="What happens next"
            onClick={() => onAction?.("What happens next with my dispute?")}
            primary
          />
        </div>
      </Shell>
    );
  if (["review_request", "rate_request", "review"].includes(type)) {
    const requestId = text(data.requestId);
    const providerPhone = text(data.providerPhone);
    return (
      <Shell
        icon={<MessageCircle className="size-4 text-primary" />}
        title={title || "Rate this request"}
        body={
          body ||
          "Your rating goes on the recorded completed outcome only. It cannot be changed afterwards."
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <CardAction
              key={stars}
              label={`${stars} star${stars === 1 ? "" : "s"}`}
              primary={stars === 5}
              onClick={() => {
                if (requestId && providerPhone && onReview)
                  onReview(requestId, providerPhone, stars);
              }}
            />
          ))}
        </div>
      </Shell>
    );
  }
  if (["calendar", "calendar_events", "calendar_event", "schedule"].includes(type)) {
    const events = Array.isArray(data.events)
      ? data.events
          .filter(
            (e): e is Record<string, unknown> =>
              !!e &&
              typeof e === "object" &&
              typeof (e as Record<string, unknown>).title === "string",
          )
          .slice(0, 10)
      : [];
    if (!events.length && !text(data.title)) return null;
    return (
      <Shell
        icon={<Clock3 className="size-4 text-primary" />}
        title={title || "Calendar"}
        body={body || "From your Kurukoo calendar only — never synced from elsewhere."}
      >
        <div className="grid gap-2">
          {events.map((e, i) => (
            <div key={String(e.id || i)} className="rounded-xl bg-elevated/60 px-3 py-2">
              <p className="text-[11.5px] font-medium">{String(e.title)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {[String(e.startAt || ""), e.location ? String(e.location) : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Ask about my schedule"
            onClick={() => onAction?.("What is on my calendar?")}
          />
        </div>
      </Shell>
    );
  }
  if (["fitness_plan", "training_plan", "workout_plan"].includes(type)) {
    const schedule = Array.isArray(data.schedule)
      ? data.schedule
          .filter(
            (s): s is Record<string, unknown> =>
              !!s &&
              typeof s === "object" &&
              typeof (s as Record<string, unknown>).day === "string",
          )
          .slice(0, 6)
      : [];
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Training plan"}
        body={
          body ||
          "A starter template you can adjust — not medical advice. Progress comes only from logged sessions."
        }
      >
        <DataList
          data={data}
          keys={["goal", "activity", "daysPerWeek", "sessionMinutes", "status"]}
        />
        {schedule.length ? (
          <div className="grid gap-2">
            {schedule.map((s, i) => (
              <div
                key={`${String(s.day)}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-elevated/60 px-3 py-2"
              >
                <p className="text-[11.5px] font-medium">
                  {String(s.day)} · {String(s.focus || "Move")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {String(s.durationMin || "")} min
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Log a session"
            onClick={() => onAction?.("Log a workout for this plan")}
            primary
          />
        </div>
      </Shell>
    );
  }
  if (["fitness_progress", "training_progress", "fitness_log", "workout_log"].includes(type)) {
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Progress"}
        body={body || "Computed strictly from your recorded logs — nothing inferred."}
      >
        <DataList
          data={data}
          keys={[
            "sessionsThisWeek",
            "minutesThisWeek",
            "totalSessions",
            "streakWeeks",
            "kind",
            "value",
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction label="Log a session" onClick={() => onAction?.("Log a workout")} primary />
          <CardAction label="My progress" onClick={() => onAction?.("Show my fitness progress")} />
        </div>
      </Shell>
    );
  }
  if (["email_draft", "email_compose", "draft_email"].includes(type)) {
    const to = text(data.to);
    const subject = text(data.subject);
    const body = text(data.body);
    const incomplete = !to || !subject || !body;
    return (
      <Shell
        icon={<MessageCircle className="size-4 text-primary" />}
        title={title || "Email draft"}
        body={
          incomplete
            ? "Still missing pieces — add them in chat and the draft updates. Nothing sends from here."
            : "Review every word below. Nothing sends until you press Send."
        }
      >
        <DataList data={data} keys={["to", "subject"]} />
        {body ? (
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed">{body}</p>
        ) : null}
        {!incomplete && to && onEmailSend ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <CardAction
              label="Send email"
              primary
              onClick={() => onEmailSend({ to, subject, body })}
            />
          </div>
        ) : null}
      </Shell>
    );
  }
  if (["form_prepare", "form_draft", "form"].includes(type)) {
    const schemaId = text(data.schemaId);
    const fields = Array.isArray(data.fields)
      ? data.fields
          .filter(
            (f): f is Record<string, unknown> =>
              !!f &&
              typeof f === "object" &&
              typeof (f as Record<string, unknown>).key === "string",
          )
          .slice(0, 12)
      : [];
    if (!schemaId || !fields.length) return null;
    return (
      <Shell
        icon={<FileCheck2 className="size-4 text-primary" />}
        title={title || "Form"}
        body={
          body ||
          "Prefilled only from your held profile (marked); blanks are yours to fill. Filing records a prepared packet — the authority channel is still required."
        }
      >
        <FormFields
          schemaId={schemaId}
          fields={fields}
          onSubmit={(values) => onFormSubmit?.(schemaId, values)}
        />
      </Shell>
    );
  }
  if (["price_watch", "price_alert", "price_watch_results", "price_results"].includes(type)) {
    const results = Array.isArray(data.results)
      ? (data.results as Record<string, unknown>[]).slice(0, 5)
      : [];
    return (
      <Shell
        icon={<Zap className="size-4 text-primary" />}
        title={title || "Price watch"}
        body={
          body ||
          "Checked against recorded offers only — never the live market. Empty means no recorded match."
        }
      >
        <DataList data={data} keys={["query", "maxPriceMinor", "currency"]} />
        {results.length ? (
          <div className="grid gap-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-xl bg-elevated/60 px-3 py-2">
                <p className="text-[11.5px] font-medium">{String(r.query || "")}</p>
                {Array.isArray(r.hits) && (r.hits as unknown[]).length ? (
                  (r.hits as Record<string, unknown>[]).slice(0, 3).map((h, j) => (
                    <p key={j} className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {String(h.title || "")}
                      {h.priceMinor != null ? ` — ${String(h.priceMinor)}` : ""}
                    </p>
                  ))
                ) : (
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">No recorded match.</p>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <CardAction
            label="Check my watches"
            onClick={() => onAction?.("Check my price watches")}
            primary
          />
        </div>
      </Shell>
    );
  }
  if (type === "auth_conversation") {
    const step = text(data.step);
    const name = text(data.name);
    const showEmail = Boolean(data.showEmail);
    const emailAction = text(data.emailAction);
    const emailLabel = text(data.emailLabel, "Continue with email instead");
    if (step === "phone") {
      return (
        <Shell
          icon={<ShieldCheck className="size-4 text-primary" />}
          title={title || `Nice to meet you${name ? `, ${name}` : ""}`}
          body={
            body || "Enter your phone number or email below and I'll create a verification request."
          }
        >
          <div className="flex flex-col gap-2">
            <CardAction
              label="Enter phone number"
              primary
              onClick={() => onAction?.("I'll enter my phone number")}
            />
            {showEmail && (
              <CardAction
                label={emailLabel}
                onClick={() => onAction?.("Continue with email instead")}
              />
            )}
          </div>
        </Shell>
      );
    }
    if (step === "otp") {
      const phone = text(data.phone);
      const email = text(data.email);
      const devCode = text(data.devCode);
      return (
        <Shell
          icon={<ShieldCheck className="size-4 text-primary" />}
          title={title || "Verification code"}
          body={
            body ||
            (phone
              ? `I've sent a 6-digit verification code to ${phone}. Enter it here to continue.`
              : email
                ? `I've sent a verification code to ${email}. Enter it here to continue.`
                : "Enter the verification code to continue.")
          }
        >
          {devCode && (
            <div className="mt-2 p-2 rounded-lg bg-elevated/50 text-[11px] font-mono text-primary">
              Development test code: {devCode}
            </div>
          )}
          <CardAction
            label="Enter code"
            primary
            onClick={() => onAction?.("I'll enter the code")}
          />
        </Shell>
      );
    }
    return null;
  }
  if (type === "auth_magic_link") {
    const email = text(data.email);
    const debugUrl = text(data.debugUrl);
    return (
      <Shell
        icon={<ShieldCheck className="size-4 text-primary" />}
        title={title || "Magic link sent"}
        body={
          body ||
          `A sign-in link has been sent to ${email}. Check your email and click the link to continue.`
        }
      >
        {debugUrl && (
          <div className="mt-2 p-2 rounded-lg bg-elevated/50 text-[11px] font-mono text-muted-foreground">
            Debug URL: {debugUrl}
          </div>
        )}
        <CardAction label="Open email" href={`mailto:${email}`} primary />
        <CardAction
          label="Continue in chat"
          onClick={() => onAction?.("I've clicked the link, continue")}
        />
      </Shell>
    );
  }
  if (["offer_compare", "offer_comparison", "compare_offers", "quotes_compare"].includes(type)) {
    const offers = Array.isArray(data.offers)
      ? data.offers
          .filter(
            (o): o is Record<string, unknown> =>
              !!o && typeof o === "object" && typeof (o as Record<string, unknown>).id === "string",
          )
          .slice(0, 4)
      : [];
    if (!offers.length) return null;
    const fulfilmentId = text(data.fulfilmentId);
    return (
      <Shell
        icon={<ShoppingBag className="size-4 text-primary" />}
        title={title || "Compare offers"}
        body={
          body ||
          "Recorded offers for this exact request, ranked by evidence first. Selecting keeps the request awaiting confirmation — nothing is booked or paid."
        }
        tone="tint"
      >
        <div className="grid gap-2">
          {offers.map((o, i) => (
            <div key={String(o.id)} className="rounded-xl bg-elevated/60 px-3 py-2.5">
              <p className="text-[12.5px] font-medium">
                {i + 1}. {text(o.title, "Offer")}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {[
                  text(o.providerName),
                  o.priceMinor != null
                    ? `${String(o.priceMinor)} ${text(o.currency)}`.trim()
                    : "price not confirmed",
                  text(o.evidenceLevel),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {fulfilmentId && onOfferSelect ? (
                <div className="mt-2">
                  <CardAction
                    label="Choose this offer"
                    primary={i === 0}
                    onClick={() => onOfferSelect(fulfilmentId, String(o.id))}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Shell>
    );
  }
  return null;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  const copy = () => {
    const done = () => {
      if (!mountedRef.current) return;
      setCopied(true);
      window.setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 1600);
    };
    try {
      const result = navigator.clipboard?.writeText(code);
      if (result && typeof result.then === "function") result.then(done, () => {});
      else done();
    } catch {
      // Clipboard is best-effort; the code remains visible when copy is unavailable.
    }
  };
  return (
    <div className="mt-2 overflow-hidden rounded-xl bg-elevated/70">
      <div className="flex items-center justify-end px-2 pt-1">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg px-2 text-[11px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pb-2.5 text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
/** Minimal safe rich-text for assistant messages: paragraphs, **bold**,
 * `inline code`, fenced code blocks, "- " lists, and [label](https://…)
 * links (https-only, validated). No dangerouslySetInnerHTML anywhere;
 * everything renders as React elements from parsed segments. */
export function RichText({ text: raw }: { text: string }) {
  const blocks = raw.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const fence = block.match(/^```(\w*)\n([\s\S]*?)```$/);
        if (fence) return <CodeBlock key={bi} code={fence[2].replace(/\n$/, "")} />;
        const lines = block.split("\n");
        const isList = lines.length > 0 && lines.every((l) => /^\s*[-•]\s+/.test(l));
        if (isList)
          return (
            <ul key={bi} className="mt-1.5 list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>
                  <InlineSegments text={l.replace(/^\s*[-•]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={bi} className={bi > 0 ? "mt-1.5" : undefined}>
            <InlineSegments text={block} />
          </p>
        );
      })}
    </>
  );
}
function InlineSegments({ text: raw }: { text: string }) {
  const parts = raw.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part))
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        if (/^`[^`]+`$/.test(part))
          return (
            <code key={i} className="rounded bg-elevated px-1 py-0.5 text-[13.5px]">
              {part.slice(1, -1)}
            </code>
          );
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (link && /^https:\/\//i.test(link[2]))
          return (
            <a
              key={i}
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {link[1]}
            </a>
          );
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Source footnotes: rendered only when the turn actually supplied a
 * `sources` string array. Https-only, fail-closed — renders nothing otherwise. */
function Sources({ data }: { data: Record<string, unknown> }) {
  const sources = Array.isArray(data.sources)
    ? data.sources.filter((s): s is string => typeof s === "string" && /^https:\/\//i.test(s))
    : [];
  if (!sources.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="font-medium">Sources:</span>
      {sources.slice(0, 4).map((s) => (
        <a
          key={s}
          href={s}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {s.replace(/^https?:\/\//i, "").split("/")[0]}
        </a>
      ))}
    </div>
  );
}

/** Listen: server text-to-speech for an assistant reply. Fetches audio on
 * demand; any transport refusal surfaces as plain text, never silence. */
function ListenButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "unavailable">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  const play = async () => {
    if (state === "loading" || state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const { fetchTtsAudio } = await import("@/lib/kurukoo-api");
      const url = await fetchTtsAudio(text);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("unavailable");
      await audio.play();
      setState("playing");
    } catch {
      setState("unavailable");
    }
  };
  return (
    <button
      type="button"
      onClick={() => void play()}
      aria-label={state === "playing" ? "Stop playback" : "Listen to this reply"}
      className="grid min-h-11 min-w-11 place-items-center rounded-lg px-2 transition-colors hover:bg-elevated hover:text-foreground"
    >
      {state === "loading"
        ? "…"
        : state === "playing"
          ? "Stop"
          : state === "unavailable"
            ? "No voice"
            : "Listen"}
    </button>
  );
}
function formatMessageTime(value?: string | null) {
  if (!value) return "";
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function Message({
  message,
  onAction,
  onCartAdd,
  onAdvance,
  onOfferSelect,
  onReview,
  onEmailSend,
  onFormSubmit,
  onRegenerate,
  onEdit,
}: {
  message: MessageModel;
  onAction?: (text: string) => void;
  onCartAdd?: (offerId: string, kind?: "offer" | "catalogue") => void;
  onAdvance?: (requestId: string, actionId: string) => void;
  onOfferSelect?: (fulfilmentId: string, offerId: string) => void;
  onReview?: (requestId: string, providerPhone: string, rating: number) => void;
  onEmailSend?: (draft: { to: string; subject: string; body: string }) => void;
  onFormSubmit?: (schemaId: string, values: Record<string, string>) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}) {
  const you = message.role === "you";
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  const time = formatMessageTime(message.createdAt);
  const copy = () => {
    const done = () => {
      if (!mountedRef.current) return;
      setCopied(true);
      window.setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 1600);
    };
    try {
      const result = navigator.clipboard?.writeText(message.text);
      if (result && typeof result.then === "function") result.then(done, () => {});
      else done();
    } catch {
      // Clipboard is best-effort; the message remains visible when copy is unavailable.
    }
  };
  return (
    <div className={cn("flex", you ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] text-[15px] leading-relaxed",
          you ? "rounded-2xl rounded-br-md bg-elevated px-4 py-2.5" : "text-foreground",
        )}
      >
        {you ? message.text : <RichText text={message.text} />}
        {!you && message.progressStage && !message.text ? (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            {readableLabel(message.progressStage) || "Working"}
          </div>
        ) : null}
        {!you && message.toolActivity && message.toolActivity.length ? (
          <div className="mt-2">
            <ToolActivityTranscript steps={message.toolActivity} />
          </div>
        ) : null}
        {!you && message.cardData ? (
          <ChatCard
            data={message.cardData}
            onAction={onAction}
            onCartAdd={onCartAdd}
            onAdvance={onAdvance}
            onOfferSelect={onOfferSelect}
            onReview={onReview}
            onEmailSend={onEmailSend}
            onFormSubmit={onFormSubmit}
          />
        ) : null}
        {!you && !message.cardData && message.capabilityResult ? (
          <ChatCard
            data={{ type: "capability_result", ...message.capabilityResult }}
            onAction={onAction}
            onCartAdd={onCartAdd}
            onAdvance={onAdvance}
            onOfferSelect={onOfferSelect}
            onReview={onReview}
            onEmailSend={onEmailSend}
            onFormSubmit={onFormSubmit}
          />
        ) : null}
        {!you && message.cardData && typeof message.cardData === "object" ? (
          <Sources data={message.cardData as Record<string, unknown>} />
        ) : null}
        <div className="mt-1 flex min-h-11 items-center gap-1 text-[11px] text-muted-foreground">
          {time ? <span>{time}</span> : null}
          <span className="flex-1" />
          {message.text ? (
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy message"}
              className="grid min-h-11 min-w-11 place-items-center rounded-lg px-2 transition-colors hover:bg-elevated hover:text-foreground"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
          {!you && onRegenerate && message.text ? (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Regenerate response"
              className="grid min-h-11 min-w-11 place-items-center rounded-lg px-2 transition-colors hover:bg-elevated hover:text-foreground"
            >
              Retry
            </button>
          ) : null}
          {!you && message.text ? <ListenButton text={message.text} /> : null}
          {you && onEdit && message.text ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit message"
              className="grid min-h-11 min-w-11 place-items-center rounded-lg px-2 transition-colors hover:bg-elevated hover:text-foreground"
            >
              Edit
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
export function actionClass(variant: "quiet" | "primary" = "quiet") {
  return cn(
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border border-border hover:bg-elevated",
  );
}
export function Action({
  children,
  onClick,
  variant = "quiet",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "quiet" | "primary";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={actionClass(variant)}>
      {children}
    </button>
  );
}
export function Progress({ steps }: { steps: WorkItem["steps"] }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-2.5 text-[14px]">
          <span
            className={cn(
              "grid size-[18px] shrink-0 place-items-center rounded-full border",
              s.done ? "border-transparent bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {s.done ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
          <span className={cn(s.done && "text-muted-foreground")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
export function WorkItemCard({
  item,
  onAdvance,
}: {
  item: WorkItem;
  onAdvance?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-medium">{item.title}</p>
          <p className="mt-1 text-[14px] text-muted-foreground">{item.detail}</p>
        </div>
        <Status stage={item.stage} />
      </div>
      <Progress steps={item.steps} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.stage !== "done" && onAdvance ? (
          <Action
            variant={item.stage === "needs_you" ? "primary" : "quiet"}
            onClick={() => onAdvance(item.id)}
          >
            {item.stage === "needs_you" ? "Confirm and finish" : "Continue"}
          </Action>
        ) : null}
        <Link
          to="/chat"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        >
          <MessageCircle className="size-3.5" />
          Continue conversation
        </Link>
      </div>
    </div>
  );
}
export function Result({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[15.5px] font-medium">{title}</p>
      <p className="mt-1 text-[14px] text-muted-foreground">{body}</p>
    </div>
  );
}
export function IntegrationGap({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Not available yet · </span>
      {children}
    </p>
  );
}
/** Preview-data quarantine badge: marks surfaces rendering the disconnected
 * preview directory. Label-only; no data touched, nothing live claimed. */
export function DemoDataBadge({ label = "Preview data" }: { label?: string }) {
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated/60 px-2.5 py-1 text-[10.5px] text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-60" />
      {label} · unverified preview directory, not live data
    </p>
  );
}
