import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, FileText, FolderOpen, Link2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass } from "@/components/kurukoo/primitives";
import { DirectoryStateBadge } from "@/components/kurukoo/surface-directory";
import { Panel, SectionHeader } from "@/components/kurukoo/ui";
import { fetchConnectedResources, type ConnectedResource } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/artifacts")({
  head: () => ({ meta: [{ title: "Artifacts — Kurukoo" }, { name: "description", content: "Find things Kurukoo has made, found or saved in the context of your work." }] }),
  component: ArtifactsPage,
});

function ArtifactsPage() {
  const [resources, setResources] = useState<ConnectedResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchConnectedResources()
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  return <div className="space-y-8 pb-10">
    <PageHeader title="Artifacts" subtitle="The things Kurukoo makes, finds and saves as part of getting something done." />

    <section className="max-w-3xl border-y border-border py-6">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center border border-border bg-elevated"><FolderOpen className="size-4" /></span>
        <div>
          <p className="text-[15px] font-medium tracking-[-0.01em]">Outcomes should leave something useful behind.</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Briefs, files, evidence, links and other outputs belong to the work that created them. Kurukoo will only show an artifact here when it has a real source or a real generated result.</p>
        </div>
      </div>
    </section>

    <section>
      <SectionHeader title="Your artifacts" subtitle="Only verified or actually generated items appear here." />
      <div className="border-y border-border py-12 text-center">
        <FileText className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 text-[14px] font-medium">Nothing saved here yet.</p>
        <p className="mx-auto mt-1.5 max-w-md text-[11.5px] leading-relaxed text-muted-foreground">When Kurukoo creates or finds something for you, it can become an artifact attached to the conversation or work that produced it.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/chat" search={{ prompt: "Create something useful for me" } as never} className={actionClass("primary")}><MessageSquare className="mr-1.5 size-3.5" />Ask Kurukoo</Link>
          <Link to="/work" className={actionClass()}>View Work <ArrowUpRight className="ml-1 size-3.5" /></Link>
        </div>
      </div>
    </section>

    <section>
      <SectionHeader title="Storage & connections" subtitle={loading ? "Checking connected resources…" : resources.length ? `${resources.length} connected resource${resources.length === 1 ? "" : "s"}` : "No connected storage resources detected"} />
      <Panel className="p-4">
        {resources.length ? <div className="flex flex-wrap gap-2">{resources.map((resource) => <span key={resource.id} className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[10px]"><DirectoryStateBadge state={resource.state === "active" || resource.state === "connected" ? "available" : "not-connected"} />{resource.vendor || resource.label}</span>)}</div> : <p className="text-[11.5px] text-muted-foreground">Connect a storage or knowledge service when you want Kurukoo to use an external destination.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/integrations" className={actionClass("primary")}>Connect a service <ArrowUpRight className="ml-1 size-3.5" /></Link>
          <Link to="/connect" className={actionClass()}>Manage connections</Link>
        </div>
      </Panel>
    </section>

    <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
      <div><FileText className="size-4 text-primary" /><p className="mt-2 text-[12px] font-medium">Made by Kurukoo</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Briefs, drafts, reports and other generated work.</p></div>
      <div><Link2 className="size-4 text-primary" /><p className="mt-2 text-[12px] font-medium">Found for you</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Useful links, offers, quotes and discovery evidence.</p></div>
      <div><FolderOpen className="size-4 text-primary" /><p className="mt-2 text-[12px] font-medium">Saved from elsewhere</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Authorised files and context from connected services.</p></div>
    </section>

    <div className="pt-1"><AskKurukoo prompt="Help me find or create an artifact for something I'm working on." /></div>
  </div>;
}
