import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, Download, FileText, KeyRound, LockKeyhole, Monitor, Plus, RefreshCw, Shield, ShieldCheck, Snowflake, Square, Target, Trash2, Zap, ArrowUpRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell";
import { actionClass } from "@/components/kurukoo/primitives";
import { encryptSecret } from "@/lib/crypto-client";
import { storeCredential, cancelCard, createCard, createExecutionSession, deleteCredential, describeError, exportTrustAudit, freezeCard, queueExecutionAction, stopExecutionSession, fetchExecutionActions, fetchTrustOverview } from "@/lib/trust-api";
import { Panel } from "@/components/kurukoo/ui";
import { SectionHeading, pretty, type TrustSnapshot } from "@/components/kurukoo/trust/shared";
import { CredentialsSection } from "@/components/kurukoo/trust/credentials";
import { CardsSection } from "@/components/kurukoo/trust/cards";
import { SessionsSection } from "@/components/kurukoo/trust/sessions";
import { AuditSection } from "@/components/kurukoo/trust/audit";
import type { CredentialType, TrustResourceState } from "@/lib/trust-api";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust — Kurukoo" },
      {
        name: "description",
        content: "Control credentials, protected payments, secure execution and your execution audit.",
      },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  const [data, setData] = useState<TrustSnapshot>({
    credentials: [],
    cards: [],
    sessions: [],
    claims: [],
    audit: [],
    auditTotal: 0,
    availability: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [newSessionId, setNewSessionId] = useState<string | null>(null);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const overview = await fetchTrustOverview();
      setData({
        credentials: overview.credentials.credentials,
        cards: overview.cards.cards,
        sessions: overview.sessions.sessions,
        claims: overview.protections.claims,
        audit: overview.audit.entries,
        auditTotal: overview.audit.total,
        availability: overview.availability as unknown as Record<string, TrustResourceState>,
      });
    } catch (cause) {
      setError(describeError(cause, "Trust controls could not be loaded."));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, work: () => Promise<unknown>, success: string) {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await work();
      await load(false);
      setNotice(success);
      return true;
    } catch (cause) {
      setError(describeError(cause, "The action could not be completed."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  function storeNewCredential(input: {
    label: string;
    domain?: string;
    credentialType: CredentialType;
    ciphertext: string;
    iv: string;
    salt: string;
  }) {
    const payload: {
      label: string;
      ciphertext: string;
      iv: string;
      salt: string;
      domain?: string;
      credentialType?: CredentialType;
    } = { label: input.label, ciphertext: input.ciphertext, iv: input.iv, salt: input.salt };
    if (input.domain) payload.domain = input.domain;
    payload.credentialType = input.credentialType;
    return act(
      "credential:create",
      () => storeCredential(payload),
      "Credential encrypted in your browser and stored as ciphertext.",
    );
  }

  async function exportAudit() {
    setBusy("audit:export");
    setError("");
    try {
      const blob = await exportTrustAudit();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "kurukoo-audit-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Audit export downloaded from Kurukoo.");
    } catch (cause) {
      setError(describeError(cause, "Audit export is not available."));
    } finally {
      setBusy(null);
    }
  }

  const states = Object.values(data.availability);
  const enabled = states.filter((state) => state.state === "available").length;
  const unavailable = states.filter((state) => state.state === "unavailable").length;
  const errored = states.filter((state) => state.state === "error").length;
  const activeSessions = data.sessions.filter((session) =>
    ["ready", "busy", "starting", "pending"].includes(session.status),
  ).length;
  const controls = !states.length
    ? {
        dot: "bg-muted-foreground",
        headline: loading
          ? "Checking your account controls…"
          : "Account controls are not readable yet",
        detail: "Availability depends on the connected service and your market.",
      }
    : errored
      ? {
          dot: "bg-destructive",
          headline: "Some account controls could not be checked",
          detail:
            `${errored} of ${states.length} capabilities could not be read from Kurukoo. ${enabled ? `${enabled} are available.` : ""}`.trim(),
        }
      : enabled === states.length
        ? {
            dot: "bg-[var(--color-success)]",
            headline: "Your account controls are active",
            detail: `All ${states.length} capabilities are enabled for this account.`,
          }
        : enabled > 0
          ? {
              dot: "bg-accent",
              headline: "Only some account controls are active",
              detail: `${enabled} of ${states.length} capabilities are enabled for this account; ${unavailable} are not enabled here yet.`,
            }
          : {
              dot: "bg-accent",
              headline: "No account controls are enabled for this account yet",
              detail: `All ${states.length} capabilities are feature-gated for this account or market, so Kurukoo shows their real state instead of a placeholder.`,
            };
  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Trust"
        subtitle="The controls around what Kurukoo may use, spend and do on your behalf. Important actions stay bounded, reviewable and reversible where the underlying service supports it."
      />

      <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium" role="status">
          <span aria-hidden="true" className={`size-2 rounded-full ${controls.dot}`} />{" "}
          {controls.headline}
        </span>
        <span className="text-[10.5px] text-muted-foreground">{controls.detail}</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className={`${actionClass()} ml-auto`}
        >
          <RefreshCw className="size-3.5" />
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-[11.5px] text-destructive"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-4 py-3 text-[11.5px]"
        >
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <Panel className="p-5">
          <KeyRound className="size-5 text-primary" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Credentials
          </p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "—" : data.credentials.length}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            Encrypted before they leave your browser
          </p>
        </Panel>
        <Panel className="p-5">
          <CreditCard className="size-5 text-primary" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Protected payments
          </p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "—" : data.cards.length}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            {data.claims.length} protection {data.claims.length === 1 ? "claim" : "claims"} on
            record
          </p>
        </Panel>
        <Panel className="p-5">
          <LockKeyhole className="size-5 text-primary" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Secure execution
          </p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "—" : activeSessions}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            {data.sessions.length} session{data.sessions.length === 1 ? "" : "s"} recorded
          </p>
        </Panel>
      </section>

      <CredentialsSection
        credentials={data.credentials}
        state={data.availability["credentials"]}
        loading={loading}
        busy={busy}
        onCreate={storeNewCredential}
        onDelete={(id, label) => {
          if (window.confirm(`Delete ${label}?`))
            void act(`${id}:delete`, () => deleteCredential(id), "Credential deleted.");
        }}
      />

      <CardsSection
        cards={data.cards}
        claims={data.claims}
        cardsState={data.availability["cards"]}
        claimsState={data.availability["protections"]}
        loading={loading}
        busy={busy}
        onCreate={(input) =>
          void act(
            "card:create",
            async () => {
              const result = await createCard(input);
              if (!result.card)
                throw new Error("Kurukoo did not return an issued card, so none is shown.");
            },
            "Card created. Its status is whatever the card provider reports.",
          )
        }
        onFreeze={(id) => void act(`${id}:freeze`, () => freezeCard(id), "Card frozen.")}
        onCancel={(id) => void act(`${id}:cancel`, () => cancelCard(id), "Card cancelled.")}
      />

      <SessionsSection
        sessions={data.sessions}
        state={data.availability["sessions"]}
        loading={loading}
        busy={busy}
        newSessionId={newSessionId}
        onCreate={() =>
          void act(
            "session:create",
            async () => {
              const session = await createExecutionSession({ ttlMinutes: 30 });
              setNewSessionId(session.id);
            },
            "Secure session requested from the execution provider.",
          )
        }
        onQueue={(sessionId, type) =>
          void act(
            `${sessionId}:${type}`,
            () => queueExecutionAction(sessionId, type),
            `Action queued: ${pretty(type)}.`,
          )
        }
        onStop={(id) => void act(`${id}:stop`, () => stopExecutionSession(id), "Session stopped.")}
      />

      <AuditSection
        entries={data.audit}
        total={data.auditTotal}
        state={data.availability["audit"]}
        loading={loading}
        busy={busy}
        onExport={() => void exportAudit()}
      />

      <section className="border-t border-border pt-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="text-[13px] font-medium">
              Trust is part of the product, not an admin afterthought.
            </p>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              Memory does not grant permission. A provider claim does not prove fulfilment. A queued
              action does not prove completion. Kurukoo keeps those boundaries visible.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/memory" className={actionClass()}>
                Manage Memory <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/connect" className={actionClass()}>
                Manage Connections <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/work" className={actionClass()}>
                Review Work <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
