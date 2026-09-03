import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Kurukoo" },
      { name: "description", content: "People and providers Kurukoo has been in touch with on your behalf." },
      { property: "og:title", content: "Contacts — Kurukoo" },
      { property: "og:description", content: "People Kurukoo has dealt with for you." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { contacts } = useKurukoo();

  return (
    <>
      <PageHeader title="Contacts" subtitle="People Kurukoo has dealt with for you." />
      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          body="When Kurukoo reaches out to someone on your behalf, they'll appear here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-elevated text-[13px] font-medium">
                  {c.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-[15px]">{c.name}</p>
                  <p className="text-[13.5px] text-muted-foreground">{c.role}</p>
                </div>
              </div>
              <span className="text-[13px] text-muted-foreground">{c.lastTouch}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
