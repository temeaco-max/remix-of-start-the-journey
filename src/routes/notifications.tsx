import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Kurukoo" },
      {
        name: "description",
        content: "Updates from Kurukoo and anything waiting on your confirmation.",
      },
      { property: "og:title", content: "Notifications — Kurukoo" },
      { property: "og:description", content: "Updates and confirmations from Kurukoo." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, confirm, markRead } = useKurukoo();

  return (
    <>
      <PageHeader title="Notifications" subtitle="Only what needs your attention." />
      {notifications.length === 0 ? (
        <>
          <EmptyState
            title="You're all caught up"
            body="Kurukoo will let you know here when something needs a decision from you."
          />
          <IntegrationGap>
            Push and email delivery aren't wired up yet, so updates only appear while this page is
            open.
          </IntegrationGap>
        </>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {notifications.map((n) => (
            <li key={n.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium">{n.title}</p>
                  <p className="mt-1 text-[14px] text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-[13px] text-muted-foreground">{n.when}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.needsConfirmation ? (
                  <Action variant="primary" onClick={() => confirm(n.id)}>
                    Confirm
                  </Action>
                ) : null}
                {!n.read ? <Action onClick={() => markRead(n.id)}>Mark as read</Action> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
