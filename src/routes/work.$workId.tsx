import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { WorkItemCard, IntegrationGap, Action } from "@/components/kurukoo/primitives";
import { Rows, SectionHeader } from "@/components/kurukoo/ui";
import { artifacts, entities } from "@/lib/kurukoo-demo";
import { ArtifactRow, ContactRow } from "@/components/kurukoo/cards";
import { useKurukoo } from "@/lib/kurukoo-store";

export const Route = createFileRoute("/work/$workId")({
  head: () => ({
    meta: [
      { title: "Request — Kurukoo" },
      {
        name: "description",
        content: "The full trail of one request: steps, people, files and outcome.",
      },
      { property: "og:title", content: "Request — Kurukoo" },
      { property: "og:description", content: "Steps, people and results for a single request." },
    ],
  }),
  component: WorkDetail,
});

function WorkDetail() {
  const { workId } = Route.useParams();
  const { work, advance } = useKurukoo();
  const item = work.find((w) => w.id === workId);

  if (!item) {
    return (
      <>
        <PageHeader title="Request" />
        <EmptyState
          title="This request isn't in your session"
          description="This request is no longer in view. Start a new request from Home."
        />
        <div className="mt-4">
          <Link to="/work" className="text-[14px] underline">
            Back to Work
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={item.title} subtitle={item.detail} />
      <WorkItemCard item={item} onAdvance={advance} />

      <section className="mt-8">
        <SectionHeader title="People involved" subtitle="People connected to this request." />
        <Rows>
          {entities.slice(0, 2).map((e) => (
            <ContactRow
              key={e.id}
              entity={e}
              right={
                <Link to="/messages" className="text-[13px] text-muted-foreground hover:underline">
                  Message
                </Link>
              }
            />
          ))}
        </Rows>
      </section>

      <section className="mt-8">
        <SectionHeader title="Files" subtitle="Files attached to this request." />
        <Rows>
          {artifacts.map((a) => (
            <ArtifactRow key={a.id} artifact={a} />
          ))}
        </Rows>
      </section>

      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Action variant="primary">Resume conversation</Action>
        </Link>
        <Link to="/artifacts">
          <Action>Open files</Action>
        </Link>
      </div>

      <IntegrationGap>
        People and files shown here are illustrative for now. Live coordination will appear here when connected.
      </IntegrationGap>
    </>
  );
}
