import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { userJobs } from "@/lib/skill-catalog";

export function CapabilityJobStrip({ compact = false }: { compact?: boolean }) {
  const jobs = userJobs.slice(0, compact ? 12 : 18);
  const startJob = (job: string) => localStorage.setItem("kurukoo-chat-draft", job);
  return <section aria-label="What you can ask Kurukoo for" className={compact ? "rounded-2xl border border-border bg-surface p-4" : "border-y border-border/70 py-7"}>
    <div className="flex items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ce4712]">Things you can ask for</p><h2 className={compact ? "mt-1 text-[16px] font-semibold tracking-tight" : "mt-1 text-[20px] font-semibold tracking-tight"}>Many jobs, one human front door.</h2></div>
      {!compact ? <Link to="/capabilities" className="hidden items-center gap-1 text-[11px] font-medium sm:inline-flex">See all capabilities <ArrowRight className="size-3.5" /></Link> : null}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">{jobs.map((job)=><Link key={job} to="/chat" onClick={()=>startJob(job)} className="rounded-full border border-border bg-background px-3 py-1.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{job}</Link>)}</div>
    {!compact ? <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">You do not need to know the internal capability. Ask naturally and Kurukoo chooses the right path underneath.</p> : null}
  </section>;
}
