import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ArtifactRow } from "@/components/kurukoo/cards";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Chips, Panel, Rows, SearchField, SectionHeader } from "@/components/kurukoo/ui";
import { artifacts } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/artifacts")({
  head: () => ({
    meta: [
      { title: "Artifacts — Kurukoo" },
      {
        name: "description",
        content: "Files you shared and things Kurukoo produced, stored where you choose.",
      },
      { property: "og:title", content: "Artifacts — Kurukoo" },
      {
        property: "og:description",
        content: "Your file layer, attached to conversation and work.",
      },
    ],
  }),
  component: ArtifactsPage,
});

const filters = ["All", "Documents", "Images", "Video", "Generated"] as const;

function ArtifactsPage() {
  const [filter, setFilter] = useState<string>(filters[0]);
  const [q, setQ] = useState("");
  const list = artifacts.filter((a) => {
    const okFilter =
      filter === "All" ||
      (filter === "Documents" && a.type === "document") ||
      (filter === "Images" && a.type === "image") ||
      (filter === "Video" && a.type === "video") ||
      (filter === "Generated" && a.type === "generated");
    return okFilter && a.name.toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <>
      <PageHeader title="Artifacts" subtitle="Everything created or shared during your requests." />
      <div className="space-y-3">
        <SearchField label="Search files" placeholder="Search files…" value={q} onChange={setQ} />
        <Chips items={filters} value={filter} onChange={setFilter} label="File types" />
      </div>

      <section className="mt-6">
        <SectionHeader title="Recent" subtitle={`${list.length} items`} />
        <Rows>
          {list.map((a) => (
            <ArtifactRow key={a.id} artifact={a} />
          ))}
        </Rows>
        <div className="mt-3 flex flex-wrap gap-2">
          <Action>Attach to conversation</Action>
          <Action>Attach to work</Action>
          <Action>Download</Action>
        </div>
      </section>

      <Panel className="mt-8 p-4">
        <p className="text-[15px] font-medium">Storage destination</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Files currently sit in temporary Kurukoo storage. Connect a provider — Google Drive,
          OneDrive, Dropbox or another — to keep them yours.
        </p>
        <Link to="/connect" className="mt-3 inline-block">
          <Action variant="primary">Open Connect</Action>
        </Link>
      </Panel>

      <IntegrationGap>
        Uploads, downloads and external storage sync are not implemented yet.
      </IntegrationGap>
    </>
  );
}
