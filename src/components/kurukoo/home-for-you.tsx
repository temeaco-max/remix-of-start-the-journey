import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BriefcaseBusiness, Building2, HandHeart, Megaphone, PenLine, Plug, Search, UsersRound, Radio, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { getKurukooRole, KURUKOO_ROLE_STORAGE_KEY, KURUKOO_ROLES, type KurukooRoleId } from "@/lib/kurukoo-personas";

const roleIcons = { seeker:Search,provider:HandHeart,business:Building2,creator:PenLine,contributor:UsersRound,partner:Plug,advertiser:Megaphone,"local-agent":BriefcaseBusiness,ambassador:Radio } satisfies Record<KurukooRoleId, typeof Search>;

function RoleCard({ role }: { role: ReturnType<typeof getKurukooRole> }) {
  const Icon = roleIcons[role.id];
  return <Link to={role.id === "seeker" ? "/chat" : role.id === "ambassador" ? "/ambassadors" : role.id === "local-agent" ? "/local-agents" : role.id === "provider" ? "/providers" : role.id === "business" ? "/businesses" : role.id === "creator" ? "/creators" : role.id === "contributor" ? "/contributors" : role.id === "partner" ? "/partners" : "/advertise" as never} className="min-w-[178px] snap-start rounded-2xl border border-border/70 bg-background/65 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-elevated">
    <div className="grid size-8 place-items-center rounded-xl bg-elevated text-muted-foreground"><Icon className="size-4" /></div>
    <p className="mt-3 text-[12px] font-semibold leading-4">{role.title}</p>
    <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">{role.description}</p>
  </Link>;
}

export function HomeForYou() {
  const [roleId, setRoleId] = useState<KurukooRoleId>("seeker");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => { setRoleId(getKurukooRole().id); setReady(true); };
    sync();
    window.addEventListener("kurukoo-role-changed", sync);
    return () => window.removeEventListener("kurukoo-role-changed", sync);
  }, []);
  const role = useMemo(() => getKurukooRole(roleId), [roleId]);
  function changeRole(next: KurukooRoleId) {
    setRoleId(next);
    window.localStorage.setItem(KURUKOO_ROLE_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("kurukoo-role-changed", { detail: { role: next } }));
  }

  return <div className="space-y-4">
    <Panel className="overflow-hidden border-border/80 bg-surface/90 p-0 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
          <div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">Made for you</p><h2 className="mt-1 text-[17px] font-semibold tracking-tight">{role.homeLabel}</h2><p className="mt-1 max-w-xl text-[11px] leading-5 text-muted-foreground">Kurukoo keeps useful actions close, without making you learn how the system works.</p></div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground"><span>Use Kurukoo as</span><select aria-label="Choose your Kurukoo role" value={ready ? roleId : "seeker"} onChange={e => changeRole(e.target.value as KurukooRoleId)} className="min-h-8 rounded-lg border border-border bg-background px-2.5 text-[10.5px] font-medium text-foreground outline-none focus:border-primary/40">{KURUKOO_ROLES.map(item => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select></label>
      </div>
      <div className="grid gap-2 border-t border-border/70 p-3 sm:grid-cols-3">
        {role.actions.map(action => <Link key={action.title} to={action.to as never} className="group rounded-xl border border-border/70 bg-background/70 p-3 transition-all hover:-translate-y-px hover:border-primary/20 hover:bg-elevated"><div className="flex items-start gap-2.5"><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">{action.title}</p><p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">{action.detail}</p></div><ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div></Link>)}
      </div>
    </Panel>

    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,.8fr)]">
      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">When you need someone</p><h2 className="mt-1 text-[15px] font-semibold">People and services Kurukoo can work with</h2></div><Link to="/discover" className="shrink-0 text-[10.5px] font-medium text-primary">Explore <ArrowUpRight className="inline size-3" /></Link></div>
        <div className="flex snap-x gap-2.5 overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }} aria-label="Kurukoo participation roles">
          {KURUKOO_ROLES.filter(item => item.id !== "seeker").slice(0, 6).map(item => <RoleCard key={item.id} role={item} />)}
        </div>
      </Panel>
      <Panel className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.10),transparent_55%)] p-5">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">The simple idea</p><h2 className="mt-2 font-serif text-[25px] leading-[1.06] tracking-[-0.035em]">You bring the outcome. Kurukoo helps with the rest.</h2><p className="mt-3 text-[12px] leading-5 text-muted-foreground">Find the right person, service, tool or route, then keep the important decisions in your hands.</p></div>
        <Link to="/how-it-works" className="mt-5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">See how it works <ArrowUpRight className="size-3.5" /></Link>
      </Panel>
    </section>
  </div>;
}
