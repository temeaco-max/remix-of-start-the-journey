import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Cookie, FileText, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";
import { legalPolicies } from "@/lib/legal-policies";

export const Route = createFileRoute("/legal/$section")({
  head: ({ params }) => { const policy = legalPolicies[params.section]; return { meta: [{ title: policy ? `${policy.title} — Kurukoo` : "Legal — Kurukoo" }, { name: "description", content: policy?.summary ?? "Kurukoo legal and policy centre." }] }; },
  loader: ({ params }) => { const policy = legalPolicies[params.section]; if (!policy) throw notFound(); return policy; },
  component: PolicyPage,
});

function iconFor(title: string) { if (title.includes("Cookie")) return Cookie; if (title.includes("Privacy") || title.includes("Security")) return LockKeyhole; if (title.includes("Compliance") || title.includes("Points") || title.includes("Community")) return Scale; return ShieldCheck; }

function PolicyPage() {
  const policy = Route.useLoaderData();
  if (!policy) throw notFound();
  const Icon = iconFor(policy.title);
  return <div className="mx-auto w-full max-w-5xl">
    <Link to="/legal" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> All legal & policies</Link>
    <section className="mt-5 max-w-4xl"><span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-brand-ink"><Icon className="size-4.5" /></span><p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Trust, legal & policy</p><h1 className="mt-1.5 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[56px]">{policy.title}</h1><p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground">{policy.summary}</p></section>
    <Panel className="mt-8 border-primary/15 bg-brand-tint/10 p-5"><div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground"><span>Last reviewed {policy.updated}</span><span>·</span><span>{policy.status}</span></div></Panel>
    <article className="mt-9 max-w-3xl space-y-8">{policy.sections.map((section, index) => <section key={section.heading}><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">{section.heading}</h2><p className="mt-2 text-[13.5px] leading-7 text-muted-foreground">{section.body}</p>{section.bullets ? <ul className="mt-3 space-y-2 pl-5 text-[13px] leading-6 text-muted-foreground">{section.bullets.map((bullet)=><li key={bullet} className="list-disc pl-1">{bullet}</li>)}</ul> : null}</section>)}</article>
    <section className="mt-10 border-t border-border pt-7"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Related policies</p><div className="mt-3 flex flex-wrap gap-2">{policy.related.map((slug)=><Link key={slug} to="/legal/$section" params={{section:slug}} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11.5px] hover:bg-elevated">{legalPolicies[slug]?.title ?? slug}<ArrowUpRight className="size-3.5" /></Link>)}</div></section>
    <div className="mt-8 rounded-2xl border border-border bg-elevated/35 p-4 text-[11.5px] leading-6 text-muted-foreground">This is the current Kurukoo product-policy foundation. It is not a jurisdiction-specific legal opinion, regulatory certification or guarantee of compliance. Binding terms, statutory notices and entity/controller details must come from the final approved legal documents.</div>
  </div>;
}
