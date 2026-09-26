import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Coins, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";

const API_BASE = (import.meta.env["VITE_KURUKOO_API_BASE_URL"] ?? "").replace(/\/$/, "");

type PointsBalance = { success?: boolean; points?: number; tier?: string; currency?: string };
type PointsEntry = { id?: number; amount?: number; type?: string; description?: string; created_at?: string };

async function readPointsJson<T>(path: string): Promise<{ response: Response; payload: T }> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as T;
  return { response, payload };
}

function PointsCard() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "signed_out" }
    | { kind: "ready"; points: number; tier: string; history: PointsEntry[] }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const balance = await readPointsJson<PointsBalance>("/api/points/balance");
        if (balance.response.status === 401) {
          if (!cancelled) setState({ kind: "signed_out" });
          return;
        }
        if (!balance.response.ok || typeof balance.payload.points !== "number") {
          if (!cancelled)
            setState({ kind: "error", message: "Points balance is unavailable right now." });
          return;
        }
        const history = await readPointsJson<{ success?: boolean; history?: PointsEntry[] }>(
          "/api/points/history?limit=5",
        );
        if (!cancelled)
          setState({
            kind: "ready",
            points: balance.payload.points,
            tier: balance.payload.tier || "Base",
            history: Array.isArray(history.payload.history) ? history.payload.history : [],
          });
      } catch {
        if (!cancelled) setState({ kind: "error", message: "Points balance is unavailable right now." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <StateCard
        icon={Coins}
        label="Points"
        title="Loading…"
        body="Reading your canonical Points balance."
      />
    );
  }
  if (state.kind === "signed_out") {
    return (
      <StateCard
        icon={Coins}
        label="Points"
        title="Sign in to view"
        body="Your Points balance appears here once you are signed in."
      />
    );
  }
  if (state.kind === "error") {
    return <StateCard icon={Coins} label="Points" title="Unavailable" body={state.message} />;
  }
  return (
    <Panel className="p-4">
      <span className="grid size-9 place-items-center rounded-xl bg-elevated text-muted-foreground">
        <Coins className="size-4" />
      </span>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Points · {state.tier}
      </p>
      <p className="mt-1 text-[17px] font-semibold">{state.points.toLocaleString()} pts</p>
      {state.history.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {state.history.slice(0, 5).map((entry, index) => (
            <li key={entry.id ?? index} className="text-[11px] leading-4 text-muted-foreground">
              <span className="font-medium text-foreground">
                {typeof entry.amount === "number" && entry.amount > 0 ? "+" : ""}
                {typeof entry.amount === "number" ? entry.amount : "—"}
              </span>{" "}
              {entry.description || entry.type || "Points movement"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">
          No Points movements yet.
        </p>
      )}
    </Panel>
  );
}

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Kurukoo" },
      {
        name: "description",
        content: "Review the canonical financial state available to your Kurukoo account.",
      },
    ],
  }),
  component: WalletPage,
});

function StateCard({
  icon: Icon,
  label,
  title,
  body,
}: {
  icon: typeof Coins;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <Panel className="p-4">
      <span className="grid size-9 place-items-center rounded-xl bg-elevated text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[17px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">{body}</p>
    </Panel>
  );
}

function WalletPage() {
  return (
    <div className="space-y-7 pb-12">
      <PageHeader
        eyebrow="Wallet"
        title="Wallet"
        subtitle="Money, Points and subscription billing stay separate. This surface only shows state that can be supported by the canonical account services."
      />
      <Panel className="mb-4 border-dashed p-4">
        <p className="text-[12.5px] font-medium">
          Points are live. Money movement is not shown here.
        </p>
        <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
          Your Points balance and recent movements below come from the canonical Points service.
          No money balance, payment method, payout or transaction is inferred from the UI.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/chat"
            search={{ query: "Help me understand my current payment and wallet state." } as never}
            className={actionClass()}
          >
            Ask Kurukoo
          </Link>
          <Link to="/subscriptions" className={actionClass()}>
            Subscriptions
          </Link>
          <Link to="/usage" className={actionClass()}>
            Usage
          </Link>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-3">
        <PointsCard />
        <StateCard
          icon={WalletCards}
          label="Wallet balance"
          title="Not available"
          body="No money balance is shown until a canonical account balance reader is available."
        />
        <StateCard
          icon={CreditCard}
          label="Payment method"
          title="Not available"
          body="No saved card, bank account or payment method is fabricated here."
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Panel className="p-5">
          <p className="text-[14px] font-medium">Payment history</p>
          <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
            Payment transactions require the canonical commercial ledger reader. Until that reader
            is exposed to the authenticated frontend, there is no history to display here.
          </p>
          <Link
            to="/activity"
            className="mt-4 inline-flex items-center gap-1 text-[10.5px] font-medium"
          >
            Open Activity <ArrowRight className="size-3.5" />
          </Link>
        </Panel>
        <Panel className="p-5">
          <p className="text-[14px] font-medium">Need to make a payment?</p>
          <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
            Use the relevant Work or checkout flow. A request, quote or checkout step is not
            represented as settled payment until the canonical payment service confirms it.
          </p>
          <AskKurukoo
            prompt="Help me make a payment for an approved Kurukoo request without assuming payment has succeeded."
            className="mt-4"
          />
        </Panel>
      </div>
    </div>
  );
}
