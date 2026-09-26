import { Download } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import type { AuditEntry, TrustResourceState } from "@/lib/trust-api";
import { LoadingRows, EmptyNote, AvailabilityNote, SectionHeading, pretty, formatWhen, kindLabel, kindIcon } from "./shared";

export function AuditSection({
  entries,
  total,
  state,
  loading,
  busy,
  onExport,
}: {
  entries: AuditEntry[];
  total: number;
  state?: TrustResourceState | undefined;
  loading: boolean;
  busy: string | null;
  onExport: () => void;
}) {
  const [kindFilter, setKindFilter] = useState("all");
  const kinds = Array.from(
    new Set(entries.map((entry) => entry.kind).filter((kind): kind is string => Boolean(kind))),
  );
  const filtered =
    kindFilter === "all" ? entries : entries.filter((entry) => entry.kind === kindFilter);
  const shown = filtered.slice(0, 25);

  return (
    <section id="audit" className="scroll-mt-6">
      <SectionHeading
        eyebrow="Evidence trail"
        title="Execution audit"
        body="A read-only timeline built from Kurukoo's existing event stores — what you asked, what was planned and what happened. It does not create a second history, and an event being recorded here is not a claim that an external action succeeded."
        action={
          <button
            type="button"
            disabled={loading || busy === "audit:export" || !entries.length}
            onClick={onExport}
            className={actionClass()}
          >
            {busy === "audit:export" ? (
              "Preparing…"
            ) : (
              <>
                <Download className="size-3.5" /> Export
              </>
            )}
          </button>
        }
      />
      {kinds.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Audit event kinds">
          {["all", ...kinds].map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={kindFilter === kind}
              onClick={() => setKindFilter(kind)}
              className={`rounded-full border px-3 py-1.5 text-[10.5px] font-medium transition-colors ${kindFilter === kind ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-elevated"}`}
            >
              {kind === "all" ? "Everything" : (kindLabel[kind] ?? pretty(kind))}
            </button>
          ))}
        </div>
      ) : null}
      <Panel className="overflow-hidden p-0">
        {loading ? (
          <LoadingRows rows={5} />
        ) : state && state.state !== "available" ? (
          <AvailabilityNote label="Execution audit" state={state} />
        ) : shown.length ? (
          <>
            <div className="divide-y divide-border">
              {shown.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-4">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center bg-elevated">
                    {kindIcon(entry.kind ?? "action")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[12.5px] font-medium">
                        {entry.title ?? entry.summary ?? pretty(entry.type ?? "Execution event")}
                      </p>
                      <span className="rounded-full bg-elevated px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        {kindLabel[entry.kind ?? ""] ?? pretty(entry.kind ?? "event")}
                      </span>
                    </div>
                    {entry.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {entry.description}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                      <span>
                        {formatWhen(entry.occurredAt ?? entry.createdAt ?? entry.timestamp) ||
                          "Time not reported"}
                      </span>
                      {entry.actor ? <span>· {entry.actor}</span> : null}
                      <span
                        className={`inline-flex items-center gap-1 ${["completed", "success", "approved"].includes(entry.status ?? "") ? "text-[var(--color-success)]" : ""}`}
                      >
                        · {entry.status ? pretty(entry.status) : "recorded"}
                      </span>
                      {entry.ref || entry.requestId ? (
                        <Link
                          to="/work/$workId"
                          params={{ workId: String(entry.ref ?? entry.requestId) }}
                          className="underline decoration-dotted"
                        >
                          · Request
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-3 text-[10.5px] text-muted-foreground">
              {filtered.length > shown.length
                ? `Showing the ${shown.length} most recent of ${filtered.length} recorded events.`
                : `${filtered.length} recorded event${filtered.length === 1 ? "" : "s"}.`}
              {total > entries.length ? ` Kurukoo returned ${entries.length} of ${total}.` : ""}
            </div>
          </>
        ) : (
          <EmptyNote>
            No audit events are available for this account yet. Once requests, goals or actions are
            recorded, they appear here.
          </EmptyNote>
        )}
      </Panel>
      <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
        For questions about what Kurukoo did on your behalf, ask in{" "}
        <Link to="/chat" className="text-primary hover:underline">
          Chat
        </Link>{" "}
        — the timeline is evidence, not a replacement for the conversation.
      </p>
    </section>
  );
}
