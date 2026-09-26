import { FileText, Monitor, Plus, Square, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { describeError, fetchExecutionActions } from "@/lib/trust-api";
import type { ActionType, ExecutionAction, ExecutionSession, TrustResourceState } from "@/lib/trust-api";
import { LoadingRows, EmptyNote, AvailabilityNote, SectionHeading, pretty, formatWhen, statusTone } from "./shared";

export function SessionsSection({
  sessions,
  state,
  loading,
  busy,
  newSessionId,
  onCreate,
  onQueue,
  onStop,
}: {
  sessions: ExecutionSession[];
  state?: TrustResourceState | undefined;
  loading: boolean;
  busy: string | null;
  newSessionId: string | null;
  onCreate: () => void;
  onQueue: (sessionId: string, type: ActionType) => void;
  onStop: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [actions, setActions] = useState<ExecutionAction[]>([]);
  const [actionsError, setActionsError] = useState("");

  useEffect(() => {
    if (newSessionId) setActiveId(newSessionId);
  }, [newSessionId]);

  useEffect(() => {
    if (!activeId) {
      setActions([]);
      return;
    }
    let cancelled = false;
    setActionsError("");
    void fetchExecutionActions(activeId)
      .then((result) => {
        if (!cancelled) setActions(result.actions);
      })
      .catch((cause) => {
        if (!cancelled)
          setActionsError(describeError(cause, "Actions for this session could not be read."));
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, busy]);

  const active = sessions.find((session) => session.id === activeId) ?? null;
  const activeStatus = active?.status ?? "";
  const queueable =
    Boolean(active) && !["stopped", "error", "provider_required"].includes(activeStatus);

  return (
    <section id="execution" className="scroll-mt-6">
      <SectionHeading
        eyebrow="Secure execution"
        title="Work Kurukoo can control"
        body="Isolated sessions for tasks that need a real browser or OS-level action. Sessions expire, can be stopped, and every queued action is recorded. A missing execution provider stays an honest unavailable state instead of a fake success."
        action={
          <button
            type="button"
            disabled={busy === "session:create"}
            onClick={onCreate}
            className={actionClass("primary")}
          >
            <Plus className="size-3.5" />{" "}
            {busy === "session:create" ? "Requesting…" : "New session"}
          </button>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Sessions · {sessions.length}
            </p>
          </div>
          {loading ? (
            <LoadingRows />
          ) : state && state.state !== "available" ? (
            <AvailabilityNote label="Secure execution" state={state} />
          ) : sessions.length ? (
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setActiveId(session.id)}
                  className={`flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-elevated/50 ${activeId === session.id ? "bg-elevated" : ""}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center bg-elevated">
                    <Monitor className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">
                      Session {session.id.slice(0, 14)}…
                    </p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                      {[
                        session.expiresAt ? `expires ${formatWhen(session.expiresAt)}` : null,
                        session.lastActionAt
                          ? `last action ${formatWhen(session.lastActionAt)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No expiry reported"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${statusTone(session.status)}`}
                  >
                    {pretty(session.status)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyNote>No secure execution sessions are recorded for this account.</EmptyNote>
          )}
        </Panel>
        <SessionActionsPanel session={active} busy={busy} onQueue={onQueue} onStop={onStop} />
      </div>
    </section>
  );
}

function SessionActionsPanel({
  session,
  busy,
  onQueue,
  onStop,
}: {
  session: ExecutionSession | null;
  busy: string | null;
  onQueue: (sessionId: string, type: ActionType) => void;
  onStop: (id: string) => void;
}) {
  const [actions, setActions] = useState<ExecutionAction[]>([]);
  const [actionsError, setActionsError] = useState("");
  const sessionId = session?.id ?? null;
  const status = session?.status ?? "";
  const queueable =
    Boolean(sessionId) && !["stopped", "error", "provider_required"].includes(status);

  useEffect(() => {
    if (!sessionId) {
      setActions([]);
      setActionsError("");
      return;
    }
    let cancelled = false;
    setActionsError("");
    void fetchExecutionActions(sessionId)
      .then((result) => {
        if (!cancelled) setActions(result.actions);
      })
      .catch((cause) => {
        if (!cancelled)
          setActionsError(describeError(cause, "Actions for this session could not be read."));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, busy]);

  const buttons: Array<{ type: ActionType; label: string; Icon: typeof Target }> = [
    { type: "navigate", label: "Navigate", Icon: Target },
    { type: "screenshot", label: "Screenshot", Icon: Monitor },
    { type: "extract", label: "Extract", Icon: FileText },
  ];

  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {sessionId ? `Actions · ${sessionId.slice(0, 14)}…` : "Actions"}
        </p>
        {sessionId ? (
          <div className="flex items-center gap-1">
            {buttons.map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                aria-label={`Queue a ${label.toLowerCase()} action`}
                title={label}
                disabled={!queueable || busy === `${sessionId}:${type}`}
                onClick={() => onQueue(sessionId, type)}
                className="grid size-8 place-items-center rounded-lg hover:bg-elevated disabled:opacity-40"
              >
                <Icon className="size-3.5" />
              </button>
            ))}
            <button
              type="button"
              aria-label="Stop this session"
              title="Stop session"
              disabled={busy === `${sessionId}:stop`}
              onClick={() => onStop(sessionId)}
              className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-elevated disabled:opacity-40"
            >
              <Square className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      {session && !queueable ? (
        <p className="border-b border-border px-4 py-2 text-[10.5px] text-muted-foreground">
          This session is {pretty(status)}, so no further actions can be queued in it.
        </p>
      ) : null}
      <div className="max-h-72 space-y-2 overflow-y-auto p-3">
        {actionsError ? (
          <p role="alert" className="p-3 text-[11.5px] text-destructive">
            {actionsError}
          </p>
        ) : !sessionId ? (
          <p className="p-3 text-center text-[11.5px] text-muted-foreground">
            Select a session to see the actions Kurukoo queued in it.
          </p>
        ) : actions.length ? (
          actions.map((action) => (
            <div
              key={action.id}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${statusTone(action.status)}`}
              >
                {pretty(action.status)}
              </span>
              <span className="text-[12px] font-medium">{pretty(action.type)}</span>
              {action.error ? (
                <span className="ml-auto truncate text-[10.5px] text-destructive">
                  {action.error}
                </span>
              ) : action.createdAt ? (
                <span className="ml-auto text-[10.5px] text-muted-foreground">
                  {formatWhen(action.createdAt)}
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <p className="p-3 text-center text-[11.5px] text-muted-foreground">
            No actions have been queued in this session yet.
          </p>
        )}
      </div>
    </Panel>
  );
}
