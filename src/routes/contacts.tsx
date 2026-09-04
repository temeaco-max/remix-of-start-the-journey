import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { ContactRow } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, ContextIconTile, Panel, Rows, StatusPill, Tabs } from "@/components/kurukoo/ui";
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
    <div className="space-y-7">
      <PageHeader title="Contacts" subtitle="People and places Kurukoo can work with for you." />

      <Panel className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <ContextIconTile className="size-11 rounded-2xl bg-elevated/80"><UserRound className="size-[18px]" /></ContextIconTile>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-muted-foreground">Your relationships</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">People you can ask Kurukoo to work with.</h2>
              <p className="mt-1 max-w-2xl text-[13.5px] leading-5 text-muted-foreground">People you have already dealt with can stay connected to future requests, conversations and work.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill>{contacts.length} reached</StatusPill>
                <StatusPill>{demo.length} known</StatusPill>
              </div>
            </div>
          </div>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="contact-search" className="sr-only">Search contacts</label>
            <input id="contact-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people and places" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </Panel>

      {contacts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2"><ContextIconTile className="size-8 rounded-lg"><UserRound className="size-4" /></ContextIconTile><div><h2 className="text-[16px] font-semibold">People Kurukoo has reached</h2><p className="text-[12.5px] text-muted-foreground">Relationships created through real work.</p></div></div>
          <Rows>
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <Avatar name={c.name} size={38} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{c.name}</span><span className="block truncate text-[13px] text-muted-foreground">Last touch · {c.lastTouch}</span></span>
                <Link to="/messages" className="shrink-0 text-[13px] font-medium text-muted-foreground hover:text-foreground">Message</Link>
              </li>
            ))}
          </Rows>
        </section>
      ) : null}

      <section>
        <div className="mb-3 px-1"><h2 className="text-[17px] font-semibold">Known people & places</h2><p className="mt-0.5 text-[13.5px] text-muted-foreground">People and providers you can ask Kurukoo to work with.</p></div>
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

      <IntegrationGap>Contacts shown here include prototype relationships. Real contacts will come from verified interactions and connected address books.</IntegrationGap>
    </div>
  );
}
