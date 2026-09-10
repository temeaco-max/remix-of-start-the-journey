import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Megaphone } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { actionClass } from "@/components/kurukoo/primitives";
import { AdSlot, Panel, SectionHeader, Tabs } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/advertising")({
  head: () => ({ meta: [
    { title: "Advertising — Kurukoo" },
    { name: "description", content: "Promote a relevant service, offer or idea through clearly labelled Kurukoo discovery." },
  ] }),
  component: AdvertisingPage,
});

const tabs = ["Start", "Placements", "Billing"] as const;

function AdvertisingPage() {
  const [tab, setTab] = useState<string>(tabs[0]);
  return <>
    <PageHeader title="Advertising" subtitle="Put your service, offer or idea in front of people when it is relevant to what they are doing." />
    <Tabs items={tabs} value={tab} onChange={setTab} />

    {tab === "Start" ? <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Megaphone className="size-4.5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Create a promotion</p><h2 className="mt-1.5 font-serif text-[29px] leading-tight tracking-[-0.035em]">Tell Kurukoo what you want to promote.</h2><p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground">Kurukoo can help shape the goal, audience, creative and placement. Publishing, eligibility and billing only happen when the relevant advertising service is available.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2"><AskKurukoo prompt="Help me create a Kurukoo advertising campaign for my service or offer." /><Link to="/chat" search={{ query: "Help me create a Kurukoo advertising campaign for my service or offer." } as never} className={actionClass()}>Start in chat <ArrowUpRight className="ml-1 size-3.5" /></Link></div>
      </Panel>
      <Panel className="p-5"><SectionHeader title="Where it can appear" subtitle="Sponsored content stays clearly labelled." /><div className="mt-3 space-y-2">{["Explore", "Search", "Topics", "Daily Picks", "Creator discovery"].map((placement) => <div key={placement} className="flex items-center justify-between rounded-xl bg-elevated px-3 py-3"><span className="text-[12.5px] font-medium">{placement}</span><span className="text-[10px] text-muted-foreground">Sponsored</span></div>)}</div></Panel>
    </div> : null}

    {tab === "Placements" ? <div className="mt-5 space-y-4"><SectionHeader title="Sponsored discovery" subtitle="See how paid placement is separated from organic recommendations." /><div className="grid gap-3 md:grid-cols-2">{["Explore feed", "Search results", "Topic feed", "Daily Picks", "Creator discovery"].map((placement) => <AdSlot key={placement} placement={placement} headline="Sponsored discovery" body="A paid placement may appear here when an eligible campaign is available." advertiser="" />)}</div></div> : null}

    {tab === "Billing" ? <Panel className="mt-5 p-5"><SectionHeader title="Advertising billing" subtitle="Payment methods, spend limits and campaign charges appear here when the advertising billing service is connected." /><div className="mt-4 flex flex-wrap gap-2"><AskKurukoo prompt="Tell me what I need to set up advertising billing on Kurukoo." /><Link to="/wallet" className={actionClass()}>Open Wallet <ArrowUpRight className="ml-1 size-3.5" /></Link></div></Panel> : null}
  </>;
}
