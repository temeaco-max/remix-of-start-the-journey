import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { ContactRow } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Rows, StatTile, Tabs } from "@/components/kurukoo/ui";
import { entities } from "@/lib/kurukoo-demo";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Kurukoo" },
      { name: "description", content: "People, providers and businesses you have an ongoing relationship with." },
      { property: "og:title", content: "Contacts — Kurukoo" },
      { property: "og:description", content: "Message, call or start work with people you know." },
    ],
  }),
  component: ContactsPage,
});

const tabs = ["Recent", "Favourites", "All"] as const;

function ContactsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [query, setQuery] = useState("");
  const { contacts } = useKurukoo();
  const demo = entities.filter((e) => ["provider", "business", "person"].includes(e.kind));
  const filtered = useMemo(() => {
    const base = tab === "Favourites" ? demo.slice(0, 1) : tab === "Recent" ? demo.slice(0, 3) : demo;
    const q = query.trim().toLowerCase();
    return q ? base.filter((e) => `${e.name} ${e.kind}`.toLowerCase().includes(q)) : base;
  }, [demo, query, tab]);

  return (
    <>
      <PageHeader title="Contacts" subtitle="The people and places Kurukoo deals with for you." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Your contacts" value={`${contacts.length}`} note="Created in this session" />
        <StatTile label="Recent" value={`${Math.min(3, demo.length)}`} note="Useful relationships" />
        <StatTile label="Directory" value={`${demo.length}`} note="Prototype discovery data" />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="contact-search" className="sr-only">Search contacts</label>
          <input id="contact-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people and places" className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>

      <div className="mt-3"><Tabs items={tabs} value={tab} onChange={setTab} /></div>

      {contacts.length > 0 ? (
        <section className="mt-5">
          <div className="mb-2 flex items-center gap-2 px-1"><UserRound className="size-4 text-muted-foreground" /><h2 className="text-[14px] font-medium">People Kurukoo has reached</h2></div>
          <Rows>
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={c.name} size={38} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px]">{c.name}</span><span className="block truncate text-[13px] text-muted-foreground">Last touch · {c.lastTouch}</span></span>
                <Link to="/messages" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">Message</Link>
              </li>
            ))}
          </Rows>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-2 px-1"><h2 className="text-[17px] font-semibold">Known people & places</h2><p className="mt-0.5 text-[13.5px] text-muted-foreground">People and providers you can ask Kurukoo to work with.</p></div>
        {filtered.length === 0 ? (
          <EmptyState title="No contacts found" body="Try a different name or clear the search." />
        ) : (
          <Rows>
            {filtered.map((e) => (
              <ContactRow key={e.id} entity={e} right={<span className="flex shrink-0 gap-3 text-[13px] text-muted-foreground"><Link to="/messages" className="hover:text-foreground">Message</Link><Link to="/calls" className="hover:text-foreground">Call</Link><Link to="/work" className="hover:text-foreground">Work</Link></span>} />
            ))}
          </Rows>
        )}
      </section>

      <IntegrationGap>
        Contacts shown here include prototype relationships. Real contacts will come from verified interactions and connected address books.
      </IntegrationGap>
    </>
  );
}
