import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Phone, Zap } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/app-shell";
import { VideoCard } from "@/components/kurukoo/cards";
import { Action, IntegrationGap, actionClass } from "@/components/kurukoo/primitives";
import {
  Avatar,
  FollowButton,
  Rows,
  SaveButton,
  SectionHeader,
  ShareButton,
  StatTile,
} from "@/components/kurukoo/ui";
import { entityById, videos } from "@/lib/kurukoo-demo";
import {
  fetchProviderProfile,
  isKurukooApiConfigured,
  type ProviderProfileContent,
} from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

const kindLabel = {
  provider: "Network",
  business: "Business",
  creator: "Creator",
  person: "Person",
  partner: "Partner",
  contributor: "Contributor",
} as const;

export const Route = createFileRoute("/profile/$entityId")({
  head: () => ({
    meta: [
      { title: "Profile — Kurukoo" },
      { name: "description", content: "A person, network member, business or creator on Kurukoo." },
      { property: "og:title", content: "Profile — Kurukoo" },
      {
        property: "og:description",
        content: "Follow, message or start work with someone on Kurukoo.",
      },
    ],
  }),
  component: ProfilePage,
});

/** Teme — the canonical internal AI participant. Static descriptor by design:
 * this page describes Kurukoo's own agent (scope fixed at seed time), never
 * a human provider. No availability, pricing, or fulfilment is claimed. */
function TemeAgentPanel() {
  const capabilities = [
    "Request monitoring — checks the recorded state of your requests.",
    "Support triage — classifies and routes issues by inspection.",
    "Follow-up coordination — keeps reminders and next steps moving.",
    "Reminder awareness — reads your scheduled reminders with you.",
    "Memory context recall — owner-scoped, provenance-backed.",
    "Draft assistance — composes text you review before anything sends.",
  ];
  return (
    <>
      <header className="flex items-start gap-4 pb-6 pt-2">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10">
          <Zap className="size-6 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 text-[24px] font-semibold">Teme</h1>
          <p className="mt-1 text-[14.5px] text-muted-foreground">
            Internal AI participant — not a human provider.
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Canonical agent record · read-only inspection plus confirmation-gated coordination.
            It cannot perform physical acts, move money, or hold professional credentials.
          </p>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/agents" className={actionClass()}>
          <Action variant="primary">Deploy Teme</Action>
        </Link>
        <Link to="/chat" className={actionClass()}>
          Talk in Chat
        </Link>
      </div>
      <section className="mt-8">
        <SectionHeader title="Declared capabilities" subtitle="Exactly what the agent runtime grants." />
        <Rows>
          {capabilities.map((c) => (
            <li key={c} className="px-4 py-3.5">
              <p className="text-[15px]">{c}</p>
            </li>
          ))}
        </Rows>
      </section>
      <IntegrationGap>
        Availability and fulfilment are never claimed for AI participants. Delegation
        pricing, where configured, is shown before anything is committed.
      </IntegrationGap>
    </>
  );
}
function ProfilePage() {
  const { entityId } = Route.useParams();
  const entity = entityById(entityId);
  const { send } = useKurukoo();
  const [canonical, setCanonical] = useState<ProviderProfileContent | null>(null);

  useEffect(() => {
    if (!isKurukooApiConfigured()) return;
    let cancelled = false;
    void fetchProviderProfile(entityId)
      .then((profile) => {
        if (!cancelled && profile?.provider) setCanonical(profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  if (entityId === "teme-ai") return <TemeAgentPanel />;

  if (!entity && !canonical) {
    return (
      <>
        <PageHeader title="Profile" />
        <EmptyState title="Not found" body="This profile isn't part of the preview directory." />
        <Link to="/explore" className="mt-4 inline-block text-[14px] underline">
          Back to Explore
        </Link>
      </>
    );
  }

  const displayName = canonical?.provider.name || entity?.name || "Profile";
  const displayVerified = canonical ? canonical.provider.verified : (entity?.verified ?? false);
  const displayLocation = canonical?.provider.location || entity?.location || "";
  const displayKind = entity ? kindLabel[entity.kind] : "Network";
  const theirVideos = entity ? videos.filter((v) => v.creatorId === entity.id) : [];

  return (
    <>
      <header className="flex items-start gap-4 pb-6 pt-2">
        <Avatar name={displayName} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 text-[24px] font-semibold">
            {displayName}
            {displayVerified ? (
              <BadgeCheck className="size-5 text-primary" aria-label="Verified" />
            ) : null}
          </h1>
          {entity?.tagline ? (
            <p className="mt-1 text-[14.5px] text-muted-foreground">{entity.tagline}</p>
          ) : null}
          <p className="mt-1 text-[13px] text-muted-foreground">
            {displayKind}
            {displayLocation ? ` · ${displayLocation}` : ""}
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {canonical
              ? `Canonical provider record${canonical.provider.verified ? " · verified" : " · unverified"}${typeof canonical.provider.trustScore === "number" ? ` · trust ${canonical.provider.trustScore}` : ""}`
              : "Preview directory — unverified preview data."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <FollowButton />
        <Link to="/messages" className={actionClass()}>
          Message
        </Link>
        <Link to="/chat" className={actionClass()}>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-4" /> Voice
          </span>
        </Link>
        <Link to="/">
          <Action variant="primary" onClick={() => send(`I need help from ${displayName}.`)}>
            Start a request
          </Action>
        </Link>
        <SaveButton />
        <ShareButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Followers" value={(entity?.followers ?? 0).toLocaleString()} />
        <StatTile
          label="Rating"
          value={entity?.rating ? `${entity.rating} / 5` : "—"}
          note={entity?.rating ? "Community rating" : "Not rated yet"}
        />
        <StatTile label="Response" value="—" note="Not measured yet" />
      </div>

      {canonical?.provider.skills?.length ? (
        <section className="mt-8">
          <SectionHeader title="Verified skills" subtitle="From the canonical provider record." />
          <Rows>
            {canonical.provider.skills.map((s) => (
              <li key={s.skill} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[15px]">{s.skill}</span>
                <span className="text-[13px] text-muted-foreground">
                  {s.jobsCompleted} jobs
                  {typeof s.hourlyRate === "number" ? ` · ${s.hourlyRate}/hr` : ""}
                </span>
              </li>
            ))}
          </Rows>
        </section>
      ) : null}

      {entity?.services?.length ? (
        <section className="mt-8">
          <SectionHeader title="Services" subtitle="What they offer." />
          <Rows>
            {entity.services.map((s) => (
              <li key={s} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[15px]">{s}</span>
                <Link
                  to="/"
                  className="text-[13.5px] underline"
                  onClick={() => send(`${s} with ${displayName}.`)}
                >
                  Request
                </Link>
              </li>
            ))}
          </Rows>
        </section>
      ) : null}

      {theirVideos.length ? (
        <section className="mt-8">
          <SectionHeader title="Content" />
          <div className="grid gap-4 sm:grid-cols-2">
            {theirVideos.map((v) => (
              <VideoCard key={v.id} video={v} creatorName={displayName} />
            ))}
          </div>
        </section>
      ) : null}

      <IntegrationGap>
        Availability and ratings are shown here only when Kurukoo has reliable information.
      </IntegrationGap>
    </>
  );
}
