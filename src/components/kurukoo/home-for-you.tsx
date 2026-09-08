import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BriefcaseBusiness, Building2, HandHeart, Megaphone, PenLine, Plug, Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { getKurukooRole, KURUKOO_ROLE_STORAGE_KEY, KURUKOO_ROLES, type KurukooRoleId } from "@/lib/kurukoo-personas";
import { cn } from "@/lib/utils";

const roleIcons = {
  seeker: Search,
  provider: HandHeart,
  business: Building2,
  creator: PenLine,
  contributor: UsersRound,
  partner: Plug,
  advertiser: Megaphone,
  "local-agent": BriefcaseBusiness,
} satisfies Record<KurukooRoleId, typeof Search>;

function RoleCard({ role }: { role: ReturnType<typeof getKurukooRole> }) {
  const Icon = roleIcons[role.id];
  return (
    <div className="min-w-[190px] max-w-[210px] snap-start rounded-2xl border border-border bg-background/70 p-3.5">
      <div className="grid size-8 place-items-center rounded-xl bg-elevated text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-[12.5px] font-semibold leading-4">{role.title}</p>
      <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">{role.description}</p>
    </div>
  );
}

export function HomeForYou() {
  const [roleId, setRoleId] = useState<KurukooRoleId>("seeker");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = getKurukooRole();
    setRoleId(stored.id);
    setReady(true);
  }, []);
  const role = useMemo(() => getKurukooRole(roleId), [roleId]);
  function changeRole(next: KurukooRoleId) {
    setRoleId(next);
    window.localStorage.setItem(KURUKOO_ROLE_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("kurukoo-role-changed", { detail: { role: next } }));
  }

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">For You</p>
            <h2 className="mt-1 text-[15px] font-semibold">{role.homeLabel}</h2>
          </div>
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Role</span>
            <select
              aria-label="Choose your Kurukoo role"
              value={ready ? roleId : "seeker"}
              onChange={(event) => changeRole(event.target.value as KurukooRoleId)}
              className="min-h-8 rounded-lg border border-border bg-background px-2.5 text-[10.5px] font-medium text-foreground outline-none"
            >
              {KURUKOO_ROLES.map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {role.actions.map((action) => (
            <Link key={action.title} to={action.to as never} className="group rounded-xl border border-border/80 bg-background p-3 hover:bg-elevated">
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold">{action.title}</p>
                  <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">{action.detail}</p>
                </div>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(250px,.85fr)] lg:items-stretch">
        <Panel className="min-w-0 overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">The network</p>
              <h2 className="mt-1 text-[14px] font-semibold">Eight ways to participate</h2>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">8 roles</span>
          </div>
          <div
            className={cn("flex snap-x gap-2.5 overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            aria-label="Kurukoo participation roles"
          >
            {KURUKOO_ROLES.map((item) => <RoleCard key={item.id} role={item} />)}
          </div>
        </Panel>

        <Panel className="flex flex-col justify-center p-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Who Kurukoo serves</p>
          <h2 className="mt-2 font-serif text-[25px] leading-[1.08] tracking-[-0.03em]">One network, many ways to participate.</h2>
          <p className="mt-3 text-[12px] leading-5 text-muted-foreground">Kurukoo brings together people who need something, people who provide it, businesses and creators, contributors and partners, advertisers and local agents.</p>
        </Panel>
      </section>
    </div>
  );
}
