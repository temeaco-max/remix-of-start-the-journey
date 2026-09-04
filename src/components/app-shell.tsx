import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Compass, ListChecks, Bell, Users, Brain, Moon, Sun, MessageSquare,
  FolderClosed, Plug, Wallet, Settings, PanelLeftClose, PanelLeftOpen,
  MapPin, ShieldCheck, CalendarDays, Target, ChevronRight, MoreHorizontal, X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Kurukoo's authenticated shell has three intentional visual zones:
// 1. OS Navigational Rail — where you go.
// 2. Personal Identity Dock — who is operating Kurukoo.
// 3. Trusted Context Rail — what Kurukoo knows is relevant right now.
const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/work", label: "Work", icon: ListChecks },
] as const;

const more = [
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
    <button
      type="button"
      aria-label={dark ? "Use light appearance" : "Use dark appearance"}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kurukoo-theme", next ? "dark" : "light");
      }}
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

function IdentityDock({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("mt-auto border-t border-border pt-4", collapsed ? "px-1" : "px-2")}>
      <div className={cn("mb-2 flex items-center", collapsed ? "justify-center" : "justify-end")}>{!collapsed && <ThemeToggle />}</div>
      <Link
        to="/settings"
        className={cn("flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-elevated", collapsed ? "justify-center" : "gap-3")}
        aria-label="Open personal identity"
        title={collapsed ? "Personal identity" : undefined}
      >
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-[#ead7c7] text-[12px] font-semibold text-[#684f3e]">
          A
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-[var(--color-success)]" />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">Ada</span>
            <span className="block truncate text-[11.5px] text-muted-foreground">Personal identity</span>
          </span>
        )}
        {!collapsed && <MoreHorizontal className="size-4 text-muted-foreground" />}
      </Link>
    </div>
  );
}

function ContextCard({ title, icon: Icon, children, action }: { title: string; icon: typeof MapPin; children: ReactNode; action?: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-elevated text-muted-foreground"><Icon className="size-4" /></span>
        <h2 className="text-[13px] font-medium">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
      {action && <button type="button" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">{action}<ChevronRight className="size-3.5" /></button>}
    </section>
  );
}

function TrustedContextRail() {
  return (
    <aside aria-label="Trusted context rail" className="hidden w-[292px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-background/55 px-4 py-5 xl:flex">
      <div className="px-1 pb-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Trusted Context Rail</p>
        <p className="mt-1 text-[13px] text-muted-foreground">Useful context around Home</p>
      </div>
      <ContextCard title="Home" icon={MapPin} action="View memory">
        <div className="space-y-3 text-[13px]">
          <div><p className="font-medium">Home</p><p className="text-muted-foreground">Osu, Accra</p></div>
          <div><p className="font-medium">Work</p><p className="text-muted-foreground">Design lead</p></div>
        </div>
      </ContextCard>
      <ContextCard title="Coming up" icon={CalendarDays} action="View full agenda">
        <div className="space-y-3">
          <div className="flex gap-3"><span className="pt-0.5 text-[11px] text-muted-foreground">15:00</span><div><p className="text-[13px] font-medium">Design review</p><p className="text-[12px] text-muted-foreground">Updated mockups</p></div></div>
          <div className="flex gap-3"><span className="pt-0.5 text-[11px] text-muted-foreground">18:30</span><div><p className="text-[13px] font-medium">Call Mum</p><p className="text-[12px] text-muted-foreground">Personal</p></div></div>
        </div>
      </ContextCard>
      <ContextCard title="Nearby" icon={MapPin} action="See nearby">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-elevated p-2.5"><p className="text-[11px] text-muted-foreground">Traffic</p><p className="mt-1 text-[13px] font-medium">Light</p></div>
          <div className="rounded-xl bg-elevated p-2.5"><p className="text-[11px] text-muted-foreground">Weather</p><p className="mt-1 text-[13px] font-medium">23°C</p></div>
        </div>
      </ContextCard>
      <ContextCard title="Safety" icon={ShieldCheck}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)]"><ShieldCheck className="size-5" /></span>
          <div><p className="text-[13.5px] font-medium">All good</p><p className="text-[12px] text-muted-foreground">Nothing needs your attention.</p></div>
        </div>
      </ContextCard>
      <ContextCard title="Task focus" icon={Target} action="Open task">
        <p className="text-[14px] font-medium">Share updated mockups</p><p className="mt-1 text-[12px] text-muted-foreground">Today, 15:00</p>
      </ContextCard>
    </aside>
  );
}

function MobileNavigation({ pathname, open, onClose }: { pathname: string; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return <>
    <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden" />
    <aside aria-label="Mobile OS navigation" className="fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-border bg-surface px-4 py-5 shadow-2xl md:hidden">
      <div className="flex items-center justify-between px-1 pb-7"><span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span><button type="button" onClick={onClose} aria-label="Close navigation" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"><X className="size-[18px]" /></button></div>
      <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">OS navigation</p>
      <nav aria-label="Primary navigation" className="space-y-1">
        {nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onClose} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-[14px]", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px]" />{label}</Link>; })}
      </nav>
      <p className="px-3 pb-1 pt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p>
      <nav aria-label="Secondary navigation" className="space-y-1">
        {more.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onClose} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px]", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[17px]" />{label}</Link>; })}
      </nav>
      <IdentityDock collapsed={false} />
    </aside>
  </>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  return <div className="min-h-screen bg-background">
    <aside aria-label="OS navigational rail" className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface/80 px-3 py-5 backdrop-blur transition-[width] duration-200 md:flex", collapsed ? "w-[76px]" : "w-[244px]")}>
      <div className={cn("flex items-center pb-7", collapsed ? "justify-center" : "justify-between px-2")}>
        {!collapsed && <span className="text-[16px] font-semibold tracking-[-0.025em]">Kurukoo</span>}
        <div className="flex items-center gap-1">
          {!collapsed && <span className="rounded-full bg-elevated px-2.5 py-1 text-[10px] font-medium text-muted-foreground">OS</span>}
          <button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((v) => !v)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}</button>
        </div>
      </div>
      <p className={cn("pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground", collapsed ? "text-center" : "px-3")}>{collapsed ? "OS" : "Navigation"}</p>
      <nav aria-label="OS navigation" className="space-y-1">
        {nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />{!collapsed && label}</Link>; })}
      </nav>
      {!collapsed && <p className="px-3 pb-1 pt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p>}
      <nav aria-label="Secondary navigation" className="space-y-1">
        {more.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2 text-[13px] transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[17px]" strokeWidth={active ? 2.1 : 1.7} />{!collapsed && label}</Link>; })}
      </nav>
      <IdentityDock collapsed={collapsed} />
    </aside>

    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur md:hidden"><div className="flex items-center justify-between px-4 py-3"><span className="text-[16px] font-semibold tracking-tight">Kurukoo</span><div className="flex items-center gap-1"><ThemeToggle /><button type="button" onClick={() => setMobileNavOpen(true)} className="grid size-9 place-items-center rounded-full hover:bg-elevated" aria-label="Open navigation"><PanelLeftOpen className="size-[18px]" /></button></div></div></header>
    <MobileNavigation pathname={pathname} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

    <div className={cn("flex min-h-screen transition-[padding] duration-200", collapsed ? "md:pl-[76px]" : "md:pl-[244px]")}>
      <main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-5">{children}</div></main>
      <TrustedContextRail />
    </div>

    <nav aria-label="Mobile primary navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">{nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} aria-label={label} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px]", active ? "text-primary" : "text-muted-foreground")}><Icon className="size-[19px]" strokeWidth={active ? 2.2 : 1.8} />{label}</Link>; })}</nav>
  </div>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) { return <header className="pb-6 pt-2"><h1 className="text-[26px] font-semibold md:text-[30px]">{title}</h1>{subtitle ? <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p> : null}</header>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center"><p className="text-[15px] font-medium">{title}</p><p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted-foreground">{body}</p></div>; }
