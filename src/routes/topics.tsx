import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { TopicCard } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { topics } from "@/lib/kurukoo-demo";

export const Route = createFileRoute("/topics")({
  head: () => ({ meta: [
    { title: "Topics — Kurukoo" },
    { name: "description", content: "Follow topics to see discussions, people and providers around them." },
    { property: "og:title", content: "Topics — Kurukoo" },
    { property: "og:description", content: "Discussions and providers grouped by subject." },
  ]}),
  component: TopicsPage,
});

function TopicsPage() {
  return <>
    <PageHeader title="Topics" subtitle="Follow a subject to see discussions and who works in it." />
    <Panel className="mb-5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[14px] font-medium">A better way to discover people and ideas</p><p className="mt-1 text-[12.5px] text-muted-foreground">Topics bring conversations, useful people and providers together without turning Kurukoo into a noisy feed.</p></div>
        <div className="flex shrink-0 gap-4 text-[11.5px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MessageCircle className="size-3.5" />Discussions</span><span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />People</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Quality</span></div>
      </div>
    </Panel>
    <div className="grid gap-3 sm:grid-cols-2">{topics.map((t) => <TopicCard key={t.slug} topic={t} />)}</div>
    <div className="mt-4 flex justify-end"><Link to="/explore" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">Discover more <ArrowUpRight className="size-3.5" /></Link></div>
    <IntegrationGap>Topic content is demo material. Ranking, moderation and persistence arrive with the backend.</IntegrationGap>
  </>;
}
