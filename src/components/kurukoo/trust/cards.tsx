import { AlertTriangle, CreditCard, Plus, Snowflake } from "lucide-react";
import { useState } from "react";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import type { PurchaseProtection, TrustResourceState, VirtualCard } from "@/lib/trust-api";
import { LoadingRows, EmptyNote, AvailabilityNote, SectionHeading, pretty, formatMinor, formatWhen, statusTone } from "./shared";

export function CardsSection({
  cards,
  claims,
  cardsState,
  claimsState,
  loading,
  busy,
  onCreate,
  onFreeze,
  onCancel,
}: {
  cards: VirtualCard[];
  claims: PurchaseProtection[];
  cardsState?: TrustResourceState | undefined;
  claimsState?: TrustResourceState | undefined;
  loading: boolean;
  busy: string | null;
  onCreate: (input: { spendLimitMinor: number; currency: string; merchantLock?: string }) => void;
  onFreeze: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState("");
  const [merchant, setMerchant] = useState("");
  const [formError, setFormError] = useState("");

  function submit() {
    setFormError("");
    const amount = Number.parseFloat(limit.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a spend limit in pounds, for example 50.");
      return;
    }
    const input: { spendLimitMinor: number; currency: string; merchantLock?: string } = {
      spendLimitMinor: Math.round(amount * 100),
      currency: "GBP",
    };
    if (merchant.trim()) input.merchantLock = merchant.trim();
    onCreate(input);
    setLimit("");
    setMerchant("");
    setOpen(false);
  }

  return (
    <section id="cards" className="scroll-mt-6">
      <SectionHeading
        eyebrow="Protected payments"
        title="One-time cards with purchase protection"
        body="Cards are single-use virtual tokens with a spend limit and an optional merchant lock. Issue, freeze and cancel are delegated to the configured card provider, so a status is only shown when the provider reports one."
        action={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={actionClass("primary")}
          >
            <Plus className="size-3.5" /> {open ? "Close" : "New card"}
          </button>
        }
      />
      {open ? (
        <Panel className="mb-3 space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              inputMode="decimal"
              aria-label="Spend limit in pounds"
              placeholder="Spend limit in pounds (e.g. 50)"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            />
            <input
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
              aria-label="Merchant lock"
              placeholder="Merchant lock (optional)"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            />
          </div>
          {formError ? (
            <p role="alert" className="text-[11.5px] text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === "card:create"}
              onClick={submit}
              className={actionClass("primary")}
            >
              {busy === "card:create" ? "Requesting…" : "Create card"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setFormError("");
              }}
              className={actionClass()}
            >
              Cancel
            </button>
          </div>
        </Panel>
      ) : null}
      <Panel className="overflow-hidden p-0">
        {loading ? (
          <LoadingRows />
        ) : cardsState && cardsState.state !== "available" ? (
          <AvailabilityNote label="One-time cards" state={cardsState} />
        ) : cards.length ? (
          <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y">
            {cards.map((card) => (
              <div key={card.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-5 text-primary" />
                    <span className="text-[13px] font-semibold">•••• {card.last4}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${statusTone(card.status)}`}
                  >
                    {pretty(card.status)}
                  </span>
                </div>
                <p className="mt-3 text-[20px] font-semibold tracking-tight">
                  {formatMinor(card.spendLimitMinor, card.currency)}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {[
                    card.currency,
                    card.merchantLock ? `locked to ${card.merchantLock}` : "any merchant",
                    card.expiresAt
                      ? `expires ${new Date(card.expiresAt).toLocaleDateString()}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.status === "active" ? (
                    <button
                      type="button"
                      disabled={busy === `${card.id}:freeze`}
                      onClick={() => onFreeze(card.id)}
                      className={actionClass()}
                    >
                      {busy === `${card.id}:freeze` ? (
                        "Freezing…"
                      ) : (
                        <>
                          <Snowflake className="size-3.5" /> Freeze
                        </>
                      )}
                    </button>
                  ) : null}
                  {card.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={busy === `${card.id}:cancel`}
                      onClick={() => {
                        if (window.confirm("Cancel this card?")) onCancel(card.id);
                      }}
                      className={actionClass()}
                    >
                      {busy === `${card.id}:cancel` ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>
            No protected payment instruments are available for this account yet.
          </EmptyNote>
        )}
      </Panel>
      {claims.length ? (
        <Panel className="mt-3 overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Purchase protection claims
            </p>
          </div>
          <div className="divide-y divide-border">
            {claims.map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                <AlertTriangle
                  className={`size-4 shrink-0 ${claim.status === "approved" ? "text-[var(--color-success)]" : claim.status === "denied" ? "text-destructive" : "text-accent"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium">
                    {formatMinor(claim.amountMinor, claim.currency ?? "GBP")} · {claim.reason}
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    {["Order " + claim.orderRef, pretty(claim.status), formatWhen(claim.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : claimsState && claimsState.state === "error" ? (
        <p role="alert" className="mt-2 text-[11px] text-destructive">
          {claimsState.message}
        </p>
      ) : null}
    </section>
  );
}
