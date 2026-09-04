import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { ContactRow } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Rows, Tabs } from "@/components/kurukoo/ui";
import { entities } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Kurukoo" },
      {
        name: "description",
        content: "People, providers and businesses you have an ongoing relationship with.",
      },
      { property: "og:title", content: "Contacts — Kurukoo" },
      { property: "og:description", content: "Message, call or start work with people you know." },
    ],
  }),
  component: ContactsPage,
});

const tabs = ["Recent", "Favourites", "All"] as const;

function ContactsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const { contacts } = useKurukoo();
  const demo = entities.filter((e) => ["provider", "business", "person"].includes(e.kind));
  const list = tab === "Favourites" ? demo.slice(0, 1) : tab === "Recent" ? demo.slice(0, 3) : demo;

  return (
    <>
      <PageHeader title="Contacts" subtitle="The people and places Kurukoo deals with for you." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      {contacts.length > 0 ? (
        <div className="mt-4">
          <Rows>
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[15px]">{c.name}</span>
                <span className="text-[13px] text-muted-foreground">{c.lastTouch}</span>
              </li>
            ))}
          </Rows>
        </div>
      ) : null}

      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            body="When Kurukoo reaches out to someone on your behalf, they'll appear here."
          />
        ) : (
          <Rows>
            {list.map((e) => (
              <ContactRow
                key={e.id}
                entity={e}
                right={
                  <span className="flex shrink-0 gap-3 text-[13px] text-muted-foreground">
                    <Link to="/messages" className="hover:underline">
                      Message
                    </Link>
                    <Link to="/calls" className="hover:underline">
                      Call
                    </Link>
                    <Link to="/work" className="hover:underline">
                      Work
                    </Link>
                  </span>
                }
              />
            ))}
          </Rows>
        )}
      </div>

      <IntegrationGap>
        Contacts shown are prototype relationships; only names created in this session are yours.
      </IntegrationGap>
    </>
  );
}
