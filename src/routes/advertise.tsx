import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Megaphone, Radar } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise — Kurukoo" },
      {
        name: "description",
        content:
          "Approved, disclosed placements across Kurukoo discovery surfaces. Self-service advertising is not available in this deployment.",
      },
    ],
  }),
  component: AdvertisePage,
});

const PLACEMENTS = [
  {
    icon: Radar,
    title: "Nearby placement",
    body: "Featured nearby placement when the relevant discovery surface is available and the campaign is approved.",
  },
  {
    icon: Megaphone,
    title: "Daily Picks carousel",
    body: "Sponsored card in the Daily Picks carousel when the campaign is approved and the placement is available.",
  },
  {
    icon: BadgeCheck,
    title: "Explore categories",
    body: "Appear in relevant Explore categories with a visible Sponsored label when the campaign is approved and the placement is available.",
  },
];

function AdvertisePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section>
        <p className="text-[12px] font-medium text-muted-foreground">Advertise</p>
        <h1 className="mt-2 max-w-4xl font-serif text-[44px] leading-[1.01] tracking-[-0.05em] md:text-[62px]">
          Reach customers through disclosed placements.
        </h1>
        <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
          Introduce your business through approved placements across relevant Kurukoo discovery
          surfaces, including Nearby Radar, Explore and Daily Picks. Advertisements are visibly
          disclosed and remain distinct from organic discovery — a placement appears only when
          its campaign review, asset, timing and disclosure are approved.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link to="/ad-campaign" className={actionClass()}>
            Start a campaign <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/chat"
            search={{ query: "I want to advertise my business" } as never}
            className={actionClass()}
          >
            Talk to Kurukoo first
          </Link>
        </div>
      </section>
      <section className="mt-12 grid gap-3 md:grid-cols-3">
        {PLACEMENTS.map((placement) => (
          <Panel key={placement.title} className="p-5">
            <placement.icon className="size-5 text-primary" />
            <p className="mt-3 text-[14px] font-semibold">{placement.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-muted-foreground">{placement.body}</p>
          </Panel>
        ))}
      </section>
      <Panel className="mt-6 border-dashed p-5">
        <p className="text-[13px] font-medium">No placeholders, no unreviewed images</p>
        <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground">
          Users can tell when a placement is sponsored, every campaign has a controlled next
          step, and sponsored cards and banners are managed through the approved campaign
          system. Self-service advertising is not available in this deployment — use Web Chat
          to describe a proposed placement or partnership.
        </p>
      </Panel>
    </div>
  );
}
