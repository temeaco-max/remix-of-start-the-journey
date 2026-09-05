import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Legal — Kurukoo" }, { name: "description", content: "Kurukoo terms, privacy, safety and the boundaries of the prototype experience." }] }),
  component: LegalPage,
});

const items = [
  ["Privacy", "Kurukoo should only use information needed to provide the experience and should make meaningful data choices understandable.", "/privacy"],
  ["Terms", "Use of the service is governed by clear terms describing accounts, requests, providers, payments and responsibilities.", "/terms"],
  ["Safety and trust", "Provider information and availability should be evidence-gated. Kurukoo should not invent a price, booking, contact or outcome.", "/help"],
] as const;

function LegalPage() {
  return <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8 md:py-14">
    <section className="max-w-3xl"><p className="text-[12px] font-medium text-muted-foreground">Trust & legal</p><h1 className="mt-2 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[54px]">The rules around Kurukoo should be as clear as the product.</h1><p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">This prototype makes the product boundaries visible. Production legal documents should be published and maintained before real transactions or commitments are enabled.</p></section>
    <div className="mt-10 grid gap-3">{items.map(([title, body, to], index) => <Panel key={title} className="flex gap-4 p-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated">{index === 0 ? <LockKeyhole className="size-4" /> : index === 1 ? <ShieldCheck className="size-4" /> : <ShieldCheck className="size-4" />}</span><div className="min-w-0 flex-1"><h2 className="text-[16px] font-semibold">{title}</h2><p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p><Link to={to as never} className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium">Open <ArrowUpRight className="size-3.5" /></Link></div></Panel>)}</div>
    <p className="mt-8 text-[12px] leading-relaxed text-muted-foreground">Prototype note: no real booking, payment or provider commitment should be inferred from this demonstration interface.</p>
  </div>;
}
