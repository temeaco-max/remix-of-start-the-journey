import { ArrowUpRight, Building2, ExternalLink, Store } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AskKurukoo } from "@/components/kurukoo/ask-kurukoo";
import { commerceSupplyTypes, exampleCommerceJourneys } from "@/lib/kurukoo-commerce";

export function CommerceOutcomes() {
  return (
    <section aria-labelledby="commercial-routes" className="rounded-[22px] border border-border bg-foreground p-5 text-background md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background/10">
          <Store className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-background/55">OUTCOME-FIRST COMMERCE</p>
          <h2 id="commercial-routes" className="mt-1 font-serif text-[26px] leading-tight tracking-[-0.035em]">Kurukoo can help you get the thing, not just find a listing.</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-background/65">Where the required supply and action path are supported, Kurukoo can compare useful options, explain the evidence, get your approval and move the request toward a real outcome.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {exampleCommerceJourneys.map((item) => (
          <AskKurukoo key={item.title} prompt={item.title} className="h-auto min-h-20 rounded-xl bg-background/10 p-3 text-left hover:bg-background/15">
            <p className="text-[11.5px] font-medium">{item.title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-background/55">{item.outcome}</p>
          </AskKurukoo>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-background/10 bg-background/5 p-3">
          <Building2 className="size-4 text-background/70" />
          <p className="mt-2 text-[11.5px] font-medium">{commerceSupplyTypes.provider}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-background/50">People and businesses whose capability, availability and fulfilment state can be grounded in Kurukoo.</p>
        </div>
        <div className="rounded-xl border border-background/10 bg-background/5 p-3">
          <Store className="size-4 text-background/70" />
          <p className="mt-2 text-[11.5px] font-medium">{commerceSupplyTypes.business_storefront}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-background/50">An executable representation of what a business offers, with requests and action paths where supported.</p>
        </div>
        <div className="rounded-xl border border-background/10 bg-background/5 p-3">
          <ExternalLink className="size-4 text-background/70" />
          <p className="mt-2 text-[11.5px] font-medium">{commerceSupplyTypes.affiliate_partner}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-background/50">Authorised external supply can be a referral or handoff rail. It is not presented as a Kurukoo provider.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/businesses" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-background px-3 text-[11.5px] font-medium text-foreground">Explore businesses <ArrowUpRight className="size-3.5" /></Link>
        <Link to="/chat" className="inline-flex min-h-8 items-center rounded-lg border border-background/15 px-3 text-[11.5px] font-medium text-background hover:bg-background/10">Tell Kurukoo what you need</Link>
      </div>
      <p className="mt-3 text-[9.5px] leading-relaxed text-background/40">Partner availability, pricing and transaction paths are shown only when supported by current evidence and authorised integrations. Advertising remains separately disclosed.</p>
    </section>
  );
}
