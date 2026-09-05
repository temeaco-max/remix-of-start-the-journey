import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, ListChecks, Bell, Users, Brain, Moon, Sun, MessageSquare, FolderClosed, Plug, Wallet, Settings, PanelLeftClose, PanelLeftOpen, MapPin, ShieldCheck, CalendarDays, Target, MoreHorizontal, X, CircleDot, Network as NetworkIcon, Tags, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isKurukooApiConfigured } from "@/lib/kurukoo-api";
import { useKurukoo } from "@/lib/kurukoo-store";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Conversation", icon: MessageSquare },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/work", label: "Work", icon: ListChecks },
] as const;

const more = [
  { to: "/network", label: "Network", icon: NetworkIcon },
  { to: "/topics", label: "Topics", icon: Tags },
  { to: "/capabilities", label: "Capabilities", icon: Sparkles },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/artifacts", label: "Files", icon: FolderClosed },
  { to: "/connect", label: "Connect", icon: Plug },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("kurukoo-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  return (
    <button type="button" aria-label={dark ? "Use light appearance" : "Use dark appearance"} onClick={() => {
      const next = !dark;
      setDark(next);
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("kurukoo-theme", next ? "dark" : "light");
    }} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

function PersonalIdentityDock({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("mt-auto border-t border-border pt-4", collapsed ? "px-1" : "px-2")}>
      <div className={cn("mb-2 flex items-center", collapsed ? "justify-center" : "justify-end")}>
        {!collapsed && <ThemeToggle />}
      </div>
      <Link to="/settings" className={cn("flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-elevated", collapsed ? "justify-center" : "gap-3")} aria-label="Open personal identity" title={collapsed ? "Personal identity" : undefined}>
        <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ead7c7] text-[12px] font-semibold text-[#684f3e]">
          A
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-[var(--color-success)]" />
        </span>
        {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">Personal</span><span className="block truncate text-[11.5px] text-muted-foreground">Identity & preferences</span></span>}
        {!collapsed && <MoreHorizontal className="size-4 text-muted-foreground" />}
      </Link>
    </div>
  );
}

function ContextCard({ title, icon: Icon, children, action, to }: { title: string; icon: typeof MapPin; children: ReactNode; action?: string; to?: string }) {
  const actionNode = action ? to
    ? <Link to={to as never} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">{action}<span aria-hidden>→</span></Link>
    : <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground">{action}</span>
    : null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-elevated text-muted-foreground"><Icon className="size-4" /></span><h2 className="text-[13px] font-medium">{title}</h2></div>
      <div className="mt-3">{children}</div>
      {actionNode}
    </section>
  );
}

function TrustedContextRail() {
  const { work, memory, notifications } = useKurukoo();
  const activeWork = work.filter((item) => item.stage !== "done").slice(0, 2);
  const unread = notifications.filter((item) => !item.read).length;
  const focus = activeWork[0];

  return (
    <aside aria-label="Trusted context rail" className="hidden w-[280px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-background/55 px-4 py-5 lg:flex">
      <div className="px-1 pb-1"><div className="flex items-center justify-between gap-3"><div><p className="text-[15px] font-semibold tracking-tight">Your context</p><p className="mt-1 text-[12.5px] text-muted-foreground">Useful things Kurukoo is keeping in view.</p></div><span className="grid size-8 place-items-center rounded-full bg-elevated text-muted-foreground" title={isKurukooApiConfigured() ? "Connected to Kurukoo" : "Preview mode"}><CircleDot className={cn("size-4", isKurukooApiConfigured() && "text-[var(--color-success)]")} /></span></div></div>
      <ContextCard title="Current work" icon={Target} action="Open work" to="/work">
        {focus ? <div><p className="text-[13.5px] font-medium">{focus.title}</p><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{focus.detail}</p><div className="mt-3 flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--color-success)]" /><span className="text-[11px] text-muted-foreground">{focus.stage === "needs_you" ? "Needs your attention" : "In progress"}</span></div></div> : <p className="text-[13px] leading-relaxed text-muted-foreground">Nothing is currently in progress.</p>}
      </ContextCard>
      <ContextCard title="Places & memory" icon={MapPin} action="View memory" to="/memory"><div className="space-y-3 text-[13px]"><div><p className="font-medium">Personal context</p><p className="text-muted-foreground">{memory.length ? `${memory.length} saved item${memory.length === 1 ? "" : "s"}` : "Nothing saved yet"}</p></div><div><p className="font-medium">Location</p><p className="text-muted-foreground">Available when you choose to share it</p></div></div></ContextCard>
      <ContextCard title="Attention" icon={CalendarDays} action="View activity" to="/activity"><div className="space-y-3">{activeWork.length ? activeWork.map((item) => <div key={item.id} className="flex gap-3"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" /><div><p className="text-[13px] font-medium">{item.title}</p><p className="text-[12px] text-muted-foreground">{item.updated}</p></div></div>) : <p className="text-[13px] text-muted-foreground">No active items need attention.</p>}</div></ContextCard>
      <ContextCard title="Safety" icon={ShieldCheck}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)]"><ShieldCheck className="size-5" /></span><div><p className="text-[13.5px] font-medium">All good</p><p className="text-[12px] text-muted-foreground">{unread ? `${unread} item${unread === 1 ? "" : "s"} waiting for you.` : "Nothing needs your attention."}</p></div></div></ContextCard>
    </aside>
  );
}

function NavLinks({ pathname, collapsed = false, onNavigate }: { pathname: string; collapsed?: boolean; onNavigate?: () => void }) {
  return <><nav aria-label="Primary OS navigation" className="space-y-1">{nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />{!collapsed && label}</Link>; })}</nav>{!collapsed && <p className="px-3 pb-1 pt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p>}<nav aria-label="Secondary OS navigation" className="space-y-1 overflow-y-auto pb-2">{more.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2 transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[17px]" strokeWidth={active ? 2.1 : 1.7} />{!collapsed && label}</Link>; })}</nav></>;
}

function MobileNavigation({ pathname, open, onClose }: { pathname: string; open: boolean; onClose: () => void }) {
  useEffect(() => { if (!open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [open, onClose]);
  if (!open) return null;
  return <><button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden" /><aside aria-label="Mobile OS navigation" className="fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-border bg-surface px-4 py-5 shadow-2xl md:hidden"><div className="flex items-center justify-between px-1 pb-7"><div className="flex items-center gap-2"><img src="/favicon.ico" alt="" className="size-7 rounded-lg" /><span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span></div><button type="button" onClick={onClose} aria-label="Close navigation" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"><X className="size-[18px]" /></button></div><NavLinks pathname={pathname} onNavigate={onClose} /><PersonalIdentityDock collapsed={false} /></aside></>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  return <div className="min-h-screen bg-background">
    <aside aria-label="OS navigational rail" className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface/80 px-3 py-5 backdrop-blur transition-[width] duration-200 md:flex", collapsed ? "w-[76px]" : "w-[244px]")}>
      <div className={cn("flex items-center pb-7", collapsed ? "justify-center" : "justify-between px-2")}><Link to="/" aria-label="Kurukoo Home" className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}><img src="/favicon.ico" alt="Kurukoo" className="size-7 rounded-lg object-contain" />{!collapsed && <span className="text-[16px] font-semibold tracking-[-0.025em]">Kurukoo</span>}</Link><button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((v) => !v)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}</button></div>
      <NavLinks pathname={pathname} collapsed={collapsed} />
      <PersonalIdentityDock collapsed={collapsed} />
    </aside>
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur md:hidden"><div className="flex items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2"><img src="/favicon.ico" alt="" className="size-7 rounded-lg" /><span className="text-[16px] font-semibold tracking-tight">Kurukoo</span></Link><div className="flex items-center gap-1"><ThemeToggle /><button type="button" onClick={() => setMobileNavOpen(true)} className="grid size-9 place-items-center rounded-full hover:bg-elevated" aria-label="Open navigation"><PanelLeftOpen className="size-[18px]" /></button></div></div></header>
    <MobileNavigation pathname={pathname} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    <div className={cn("flex min-h-screen transition-[padding] duration-200", collapsed ? "md:pl-[76px]" : "md:pl-[244px]")}>
      <main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-5">{children}</div></main>
      <TrustedContextRail />
    </div>
    <nav aria-label="Mobile primary navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur md:hidden">{nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px]", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span></Link>; })}</nav>
  </div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5"><div className="min-w-0"><h1 className="text-[30px] font-semibold tracking-[-0.035em] md:text-[34px]">{title}</h1>{subtitle ? <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{subtitle}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</header>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <section className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]"><p className="text-[16px] font-medium tracking-tight">{title}</p><p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">{body}</p></section>;
}
