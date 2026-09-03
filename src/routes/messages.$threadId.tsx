import { createFileRoute, Link } from "@tanstack/react-router";
import { Paperclip, Phone } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { Composer } from "@/components/kurukoo/composer";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { entityById, threadById } from "@/lib/kurukoo-demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — Kurukoo" },
      { name: "description", content: "A direct thread with a provider or business, with the work in context." },
      { property: "og:title", content: "Conversation — Kurukoo" },
      { property: "og:description", content: "Message, call and approve in one thread." },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const thread = threadById(threadId);
  const who = thread ? entityById(thread.withId) : undefined;

  if (!thread) {
    return (
      <>
        <PageHeader title="Conversation" />
        <EmptyState title="Thread not found" body="Open Messages to see your conversations." />
        <Link to="/messages" className="mt-4 inline-block text-[14px] underline">
          Back to Messages
        </Link>
      </>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <PageHeader title={who?.name ?? "Conversation"} subtitle={thread.subject} />

      <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
        <p className="text-[13.5px] text-muted-foreground">
          Linked to work: <span className="text-foreground">{thread.subject}</span>
        </p>
        <div className="flex gap-2">
          <Link to="/work">
            <Action>Open work</Action>
          </Link>
          <Link to="/calls">
            <Action>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4" /> Call
              </span>
            </Action>
          </Link>
        </div>
      </Panel>

      <div className="flex-1 space-y-4">
        {thread.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                m.from === "you"
                  ? "rounded-br-md bg-elevated"
                  : "rounded-bl-md border border-border bg-surface",
              )}
            >
              {m.text}
              <span className="mt-1 block text-[11.5px] text-muted-foreground">{m.when}</span>
            </div>
          </div>
        ))}

        <Panel className="p-4">
          <p className="text-[14px] font-medium">Approval requested</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Nothing is confirmed until you approve it here.
          </p>
          <div className="mt-3 flex gap-2">
            <Action variant="primary">Approve Thursday 9am</Action>
            <Action>Suggest another time</Action>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Paperclip className="size-4" /> Attachments and voice messages use the same composer.
      </div>
      <Composer onSend={() => undefined} placeholder="Write a message…" />
      <IntegrationGap>
        Sending is disabled in the prototype — messages are not delivered anywhere.
      </IntegrationGap>
    </div>
  );
}
