import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, ListChecks, Bell, Users, Brain, Moon, Sun, MessageSquare, FolderClosed, Plug, Wallet, Settings, PanelLeftClose, PanelLeftOpen, Bookmark, Radio, ShieldCheck, MoreHorizontal, X, Network as NetworkIcon, Tags, Sparkles, Car, CloudSun, Wind, Check, Briefcase, HeartPulse, MapPin, Target, Search, CircleHelp } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
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

export function useProfileName() {
  const [name, setName] = useState("Ada");
  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem("kurukoo-profile-name")?.trim();
      if (stored) setName(stored);
    };
    read();
    window.addEventListener("kurukoo-profile-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("kurukoo-profile-updated", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return name;
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("kurukoo-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  return <button type="button" aria-label={dark ? "Use light appearance" : "Use dark appearance"} onClick={() => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("kurukoo-theme", next ? "dark" : "light"); }} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>;
}
function PersonalIdentityDock({ collapsed }: { collapsed: boolean }) {
  const profileName = useProfileName();
  const initial = profileName.charAt(0).toUpperCase() || "A";
  return <div className={cn("mt-auto border-t border-border pt-4", collapsed ? "px-1" : "px-2")}><div className={cn("mb-2 flex items-center", collapsed ? "justify-center" : "justify-end")}>{!collapsed && <div className="flex items-center gap-1.5"><Link to="/advertising" aria-label="Advertise" title="Advertise" className="px-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">Advertise</Link><Link to="/help" aria-label="Help" title="Help" className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"><CircleHelp className="size-[18px]" /></Link><ThemeToggle /></div>}</div><Link to="/settings" className={cn("flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-elevated", collapsed ? "justify-center" : "gap-3")} aria-label="Open personal identity" title={collapsed ? "Personal identity" : undefined}><span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ead7c7] text-[12px] font-semibold text-[#684f3e]">{initial}<span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-[var(--color-success)]" /></span>{!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{profileName}</span><span className="block truncate text-[11.5px] text-muted-foreground">Identity & preferences</span></span>}{!collapsed && <MoreHorizontal className="size-4 text-muted-foreground" />}</Link></div>;
}

type ContextIcon = typeof Bookmark;
function ContextSection({ title, icon: Icon, action, to, children }: { title: string; icon: ContextIcon; action?: string; to?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 shadow-[0_2px_12px_rgba(80,60,40,0.035)] dark:border-border dark:bg-surface"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Icon className="size-[15px] text-muted-foreground" strokeWidth={1.8} /><h2 className="text-[13px] font-semibold tracking-tight">{title}</h2></div>{action && to ? <Link to={to as never} className="text-muted-foreground hover:text-foreground" aria-label={action}><MoreHorizontal className="size-4" /></Link> : null}</div><div className="mt-2.5">{children}</div></section>;
}
function ContextRow({ icon: Icon, title, detail, tone = "bg-elevated text-muted-foreground", className }: { icon: ContextIcon; title: string; detail: string; tone?: string; className?: string }) {
  return <div className={cn("flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5", className)}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}><Icon className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-[12px] font-medium">{title}</p><p className="truncate text-[10.5px] text-muted-foreground">{detail}</p></div></div>;
}
const railSearchItems = [
  { title: "Home", detail: "Osu, Accra", icon: Home, to: "/" },
  { title: "Work", detail: "Design lead", icon: Briefcase, to: "/work" },
  { title: "Places", detail: "Saved places", icon: MapPin, to: "/memory" },
  { title: "Memory", detail: "Remembered details", icon: Brain, to: "/memory" },
  { title: "Explore", detail: "People, places and ideas", icon: Compass, to: "/explore" },
  { title: "Wallet", detail: "Balance, points and purchases", icon: Wallet, to: "/wallet" },
  { title: "Safety", detail: "Trusted and protected", icon: ShieldCheck, to: "/settings" },
];
function TrustedContextSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onOpenChange(true); window.setTimeout(() => document.getElementById("trusted-context-search")?.focus(), 0); }
      if (event.key === "Escape") { setQuery(""); setSubmitted(""); onOpenChange(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);
  const results = useMemo(() => { const term = submitted.trim().toLowerCase(); return term ? railSearchItems.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(term)) : []; }, [submitted]);
  return open ? <div className="min-w-0 flex-1"><div className="rounded-xl border border-[#e8e1d8] bg-[#fbfaf7] p-2 shadow-[0_2px_12px_rgba(80,60,40,0.035)]"><div className="flex items-center gap-2"><Search className="size-4 shrink-0 text-muted-foreground" /><input id="trusted-context-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setSubmitted(query); }} placeholder="Search trusted context" className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground" /><kbd className="shrink-0 rounded-md border border-[#e5ded5] bg-background px-1.5 py-0.5 text-[9px] font-medium">⌘K</kbd></div></div>{submitted ? <ContextSection title={`Search · ${submitted}`} icon={Search}><div className="space-y-0.5">{results.length ? results.map((item) => <Link key={item.title} to={item.to as never} onClick={() => { setQuery(""); setSubmitted(""); onOpenChange(false); }} className="block rounded-xl px-1.5 py-1.5 hover:bg-elevated"><ContextRow icon={item.icon} title={item.title} detail={item.detail} /></Link>) : <p className="px-1.5 py-2 text-[10.5px] text-muted-foreground">No trusted context found.</p>}</div></ContextSection> : null}</div> : <button type="button" onClick={() => onOpenChange(true)} aria-label="Search trusted context" title="Search trusted context (⌘K)" className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"><Search className="size-[17px]" /></button>;
}
function TrustedContextRail({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { work, memory, notifications } = useKurukoo();
  const [searchOpen, setSearchOpen] = useState(false);
  const activeWork = work.filter((item) => item.stage !== "done").slice(0, 2);
  const unread = notifications.filter((item) => !item.read).length;
  const focus = activeWork[0];
  const isWork = pathname === "/work" || pathname.startsWith("/work/");
  const isMemory = pathname === "/memory" || pathname.startsWith("/memory/");
  const isExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  return <aside aria-label="Trusted context rail" aria-hidden={!open} className={cn("hidden shrink-0 flex-col overflow-y-auto border-l border-[#e7e0d7] bg-[#f5f1eb] py-4 transition-[width,padding] duration-200 lg:flex dark:border-border dark:bg-background", open ? "w-[224px] px-3" : "w-[48px] px-1.5")}>
    <div className={cn("mb-2 flex items-center gap-1", open ? "justify-between" : "justify-center")}>
      <button type="button" onClick={() => { setSearchOpen(false); onOpenChange(!open); }} aria-label={open ? "Close trusted context rail" : "Open trusted context rail"} title={open ? "Close trusted context rail" : "Open trusted context rail"} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground">{open ? <PanelLeftClose className="size-[17px] rotate-180" /> : <PanelLeftOpen className="size-[17px] rotate-180" />}</button>
      {open ? <TrustedContextSearch open={searchOpen} onOpenChange={setSearchOpen} /> : null}
    </div>
    {open ? <div className="space-y-3">
      <ContextSection title="Trusted context" icon={Bookmark} action="Open trusted context" to="/memory"><div className="space-y-0.5"><ContextRow icon={Home} title="Home" detail="Osu, Accra" tone="bg-[#eaf2fa] text-[#4d88b8]" /><ContextRow icon={Briefcase} title="Work" detail="Design lead" tone="bg-[#f9eadf] text-[#c56d32]" /><ContextRow icon={HeartPulse} title="Health" detail="7h sleep · Good" tone="bg-[#fae8e6] text-[#d76d61]" /></div></ContextSection>
      <ContextSection title="Places" icon={MapPin} action="Open places" to="/memory"><ContextRow icon={MapPin} title="Saved places" detail={memory.length ? `${memory.length} saved item${memory.length === 1 ? "" : "s"}` : "Nothing saved yet"} tone="bg-[#f4eee6] text-[#765443]" /></ContextSection>
      <ContextSection title="Memory" icon={Brain} action="Open memory" to="/memory"><ContextRow icon={Brain} title="Remembered details" detail={memory.length ? `${memory.length} item${memory.length === 1 ? "" : "s"} available` : "Nothing saved yet"} tone="bg-[#eee9f7] text-[#75619b]" /></ContextSection>
      {isWork ? <ContextSection title="Current work" icon={Briefcase} action="Open work" to="/work"><ContextRow icon={Target} title={focus?.title ?? "Nothing in progress"} detail={focus?.detail ?? "Start a request to create work."} tone="bg-[#f9eadf] text-[#c56d32]" /></ContextSection> : null}
      {isMemory ? <ContextSection title="Memory in view" icon={Brain} action="Open memory" to="/memory"><ContextRow icon={Brain} title="Current memory surface" detail="Saved places and remembered details are available here." tone="bg-[#eee9f7] text-[#75619b]" /></ContextSection> : null}
      {isExplore ? <ContextSection title="Discovery" icon={Compass} action="Explore" to="/explore"><ContextRow icon={Compass} title="People, places & ideas" detail="Useful context for what you're exploring." tone="bg-[#eaf2fa] text-[#4d88b8]" /><div className="mt-2 rounded-xl bg-[#f4eee6] px-2.5 py-2"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Advertising</p><p className="mt-0.5 text-[11px] text-muted-foreground">Sponsored discovery will appear here when connected to Kurukoo Advertising.</p></div></ContextSection> : null}
      <ContextSection title="Wallet" icon={Wallet} action="Open wallet" to="/wallet"><ContextRow icon={Wallet} title="Balance and points" detail="Review before committing." tone="bg-[#eaf1e9] text-[#55705a]" /></ContextSection>
      <ContextSection title="Nearby pulse" icon={Radio} action="See nearby" to="/explore"><div className="space-y-0.5"><ContextRow icon={Car} title="Traffic" detail="Light" tone="bg-[#e8f3e8] text-[#4d8c58]" /><ContextRow icon={CloudSun} title="Weather" detail="23°C · Partly cloudy" tone="bg-[#fbf2df] text-[#b38a36]" /><ContextRow icon={Wind} title="Air quality" detail="Good" tone="bg-[#e8f1e8] text-[#5d8960]" /></div><Link to="/explore" className="mt-1.5 flex items-center text-[11.5px] font-medium text-primary hover:opacity-80">See nearby <span className="ml-auto text-base leading-none">›</span></Link></ContextSection>
      <ContextSection title="Safety state" icon={ShieldCheck}><div className="flex items-center gap-2.5"><span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#e7f2e8] text-[#5c9464]"><span aria-hidden className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(var(--color-success) 82%, transparent 82%)", mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))" }} /><span className="text-[10px] font-semibold">82%</span></span><div className="min-w-0"><p className="text-[12.5px] font-medium text-[#5c9464]">All good</p><p className="truncate text-[10.5px] text-muted-foreground">{unread ? `${unread} item${unread === 1 ? "" : "s"} waiting for you.` : "We've got you"}</p></div></div></ContextSection>
      <ContextSection title="Task focus" icon={Target} action="Open work" to="/work"><div className="rounded-xl bg-[#f4eee6] px-2.5 py-2 dark:bg-elevated"><div className="flex items-center gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-background text-muted-foreground"><Target className="size-3.5" /></span><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Current work</p>{focus ? <p className="mt-0.5 truncate text-[12px] font-medium">{focus.title}</p> : <p className="mt-0.5 text-[12px] text-muted-foreground">Nothing in progress</p>}</div></div>{focus ? <p className="mt-1.5 pl-8 text-[10.5px] leading-relaxed text-muted-foreground">{focus.detail}</p> : null}</div></ContextSection>
    </div> : null}
  </aside>;
}

function NavLinks({ pathname, collapsed = false, onNavigate }: { pathname: string; collapsed?: boolean; onNavigate?: () => void }) {
  return <><nav aria-label="Primary OS navigation" className="space-y-1">{nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />{!collapsed && label}</Link>; })}</nav>{!collapsed && <p className="px-3 pb-1 pt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p>}<nav aria-label="Secondary OS navigation" className="space-y-1 overflow-y-auto pb-2">{more.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />{!collapsed && label}</Link>; })}</nav></>;
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
  const [trustedContextOpen, setTrustedContextOpen] = useState(true);
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);
  return <div className="min-h-screen bg-background"><aside aria-label="OS navigational rail" className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface/80 px-3 py-6 backdrop-blur transition-[width] duration-200 md:flex", collapsed ? "w-[76px]" : "w-[200px]")}><div className={cn("relative flex items-center pb-6", collapsed ? "group justify-center" : "justify-between px-2")}><Link to="/" aria-label="Kurukoo Home" className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}><span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f4e6dc] text-[13px] font-semibold tracking-[-0.02em] text-[#765443]">K</span>{!collapsed && <span className="text-[16px] font-semibold tracking-[-0.025em]">Kurukoo</span>}</Link><button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((v) => !v)} className={cn("grid size-9 place-items-center rounded-full text-muted-foreground transition-all hover:bg-elevated hover:text-foreground", collapsed ? "pointer-events-none absolute right-0 top-0 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100" : "")}>{collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}</button></div><NavLinks pathname={pathname} collapsed={collapsed} /><PersonalIdentityDock collapsed={collapsed} /></aside><header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur md:hidden"><div className="flex items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2"><span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f4e6dc] text-[13px] font-semibold tracking-[-0.02em] text-[#765443]">K</span><span className="text-[16px] font-semibold tracking-tight">Kurukoo</span></Link><div className="flex items-center gap-1"><ThemeToggle /><button type="button" onClick={() => setMobileNavOpen(true)} className="grid size-9 place-items-center rounded-full hover:bg-elevated" aria-label="Open navigation"><PanelLeftOpen className="size-[18px]" /></button></div></div></header><MobileNavigation pathname={pathname} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} /><div className={cn("flex min-h-screen transition-[padding] duration-200", collapsed ? "md:pl-[76px]" : "md:pl-[200px]")}><main className="min-w-0 flex-1 bg-background"><div className="w-full min-w-0 px-4 pb-28 pt-4 md:px-5 md:pb-12 md:pt-5">{children}</div></main><TrustedContextRail open={trustedContextOpen} onOpenChange={setTrustedContextOpen} /></div><nav aria-label="Mobile primary navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur md:hidden">{nav.map(({ to, label, icon: Icon }) => { const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px]", active ? "bg-[#f4e6dc] font-medium text-foreground" : "text-muted-foreground")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span></Link>; })}</nav></div>;
}
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) { return <header className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5"><div className="min-w-0"><h1 className="text-[30px] font-semibold tracking-[-0.035em] md:text-[34px]">{title}</h1>{subtitle ? <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{subtitle}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</header>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <section className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]"><p className="text-[16px] font-medium tracking-tight">{title}</p><p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">{body}</p></section>; }