import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, ListChecks, Bell, Users, Brain, Moon, Sun, MessageSquare, FolderClosed, Plug, Wallet, Settings, PanelLeftClose, PanelLeftOpen, Bookmark, ShieldCheck, MoreHorizontal, Network as NetworkIcon, Tags, Sparkles, CircleHelp, Zap, Briefcase, HeartPulse, MapPin, Target, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useKurukoo } from "@/lib/kurukoo-store";
import type { AppNavItem } from "@/lib/kurukoo-types";

const nav: AppNavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Conversation", icon: Sparkles },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/work", label: "Work", icon: ListChecks },
];

const more: AppNavItem[] = [
  { to: "/network", label: "Network", icon: NetworkIcon },
  { to: "/topics", label: "Topics", icon: Tags },
  { to: "/capabilities", label: "Capabilities", icon: Zap },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/artifacts", label: "Files", icon: FolderClosed },
  { to: "/connect", label: "Connect", icon: Plug },
  { to: "/providers", label: "Providers", icon: ShieldCheck },
  { to: "/businesses", label: "Businesses", icon: Briefcase },
  { to: "/creators", label: "Creators", icon: Sparkles },
  { to: "/advertising", label: "Advertising", icon: Zap },
  { to: "/pricing", label: "Plans", icon: Wallet },
  { to: "/subscriptions", label: "Subscriptions", icon: Wallet },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function useProfileName() {
  const [profileName, setProfileName] = useState("Alex");
  useEffect(() => {
    const stored = localStorage.getItem("kurukoo-profile-name");
    if (stored) setProfileName(stored);
  }, []);
  return profileName;
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
  const { loggedIn } = useKurukoo();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (collapsed) setMenuOpen(false); }, [collapsed]);
  const closeMenu = () => setMenuOpen(false);
  const logout = () => { localStorage.removeItem("kurukoo-authenticated"); window.dispatchEvent(new Event("kurukoo-auth-updated")); setMenuOpen(false); };
  return <div className={cn("relative mt-auto border-t border-border pt-4", collapsed ? "px-1" : "px-2")}>
    <div className={cn("mb-2 flex items-center", collapsed ? "justify-center" : "justify-end")}>{!collapsed && <div className="flex items-center gap-1.5"><Link to="/advertising" aria-label="Advertise" title="Advertise" className="px-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">Advertise</Link><Link to="/help" aria-label="Help" title="Help" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"><CircleHelp className="size-[18px]" /></Link><ThemeToggle /></div>}</div>
    {!collapsed && menuOpen ? <div role="menu" aria-label="Account menu" className="absolute bottom-[76px] right-2 z-50 w-48 rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"><Link role="menuitem" to="/profile/$entityId" params={{ entityId: "me" }} onClick={closeMenu} className="block rounded-xl px-3 py-2 text-[12.5px] hover:bg-elevated">Profile</Link><Link role="menuitem" to="/memory" onClick={closeMenu} className="block rounded-xl px-3 py-2 text-[12.5px] hover:bg-elevated">Memory</Link><Link role="menuitem" to="/subscriptions" onClick={closeMenu} className="block rounded-xl px-3 py-2 text-[12.5px] hover:bg-elevated">Subscriptions</Link><Link role="menuitem" to="/settings" onClick={closeMenu} className="block rounded-xl px-3 py-2 text-[12.5px] hover:bg-elevated">Settings</Link><button role="menuitem" type="button" onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-[12.5px] text-muted-foreground hover:bg-elevated hover:text-foreground">Log out</button></div> : null}
    <div className={cn("flex w-full items-center rounded-xl p-2", collapsed ? "flex-col justify-center gap-1" : "gap-3")}><Link to="/settings" className={cn("flex min-w-0 items-center rounded-xl text-left transition-colors hover:bg-elevated", collapsed ? "justify-center" : "flex-1 gap-3")} aria-label="Open personal profile" title={collapsed ? "Profile" : undefined}><span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ead7c7] text-[12px] font-semibold text-[#684f3e]">{initial}<span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-[var(--color-success)]" /></span>{!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{profileName}</span></span>}</Link>{!collapsed && <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Open profile menu" title="Profile menu" onClick={() => setMenuOpen((v) => !v)} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"><MoreHorizontal className="size-4" /></button>}{collapsed && !loggedIn ? <Link to="/login" className="text-[10.5px] font-medium text-muted-foreground hover:text-foreground">Sign In</Link> : null}</div>
  </div>;
}

type ContextIcon = typeof Bookmark;
function ContextSection({ title, icon: Icon, action, to, children }: { title: string; icon: ContextIcon; action?: string; to?: string; children: ReactNode }) { return <section className="rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 shadow-[0_2px_12px_rgba(80,60,40,0.035)] dark:border-border dark:bg-surface"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Icon className="size-[15px] text-muted-foreground" strokeWidth={1.8} /><h2 className="text-[13px] font-semibold tracking-tight">{title}</h2></div>{action && to ? <Link to={to as never} className="text-muted-foreground hover:text-foreground" aria-label={action}><MoreHorizontal className="size-4" /></Link> : null}</div><div className="mt-2.5">{children}</div></section>; }
function ContextRow({ icon: Icon, title, detail, tone = "bg-elevated text-muted-foreground", className }: { icon: ContextIcon; title: string; detail: string; tone?: string; className?: string }) { return <div className={cn("flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5", className)}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}><Icon className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-[12px] font-medium">{title}</p><p className="truncate text-[10.5px] text-muted-foreground">{detail}</p></div></div>; }

const railSearchItems = [
  { title: "Home", detail: "Osu, Accra", icon: Home, to: "/" },
  { title: "Work", detail: "Design lead", icon: Briefcase, to: "/work" },
  { title: "Memory", detail: "Recent context", icon: Brain, to: "/memory" },
  { title: "Wallet", detail: "Points & money", icon: Wallet, to: "/wallet" },
];

function TrustedContextSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState(""); const [submitted, setSubmitted] = useState("");
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onOpenChange(true); } if (event.key === "Escape") onOpenChange(false); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [onOpenChange]);
  const results = useMemo(() => { const term = submitted.trim().toLowerCase(); return term ? railSearchItems.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(term)) : []; }, [submitted]);
  return open ? <div className="min-w-0 flex-1"><div className="rounded-xl border border-[#e8e1d8] bg-[#fbfaf7] p-2 shadow-[0_2px_12px_rgba(80,60,40,0.035)]"><div className="flex items-center gap-2"><Search className="size-4 shrink-0 text-muted-foreground" /><input id="trusted-context-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setSubmitted(query); }} placeholder="Search trusted context" className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground" /><kbd className="shrink-0 rounded-md border border-[#e5ded5] bg-background px-1.5 py-0.5 text-[9px] font-medium">⌘K</kbd></div></div>{submitted ? <ContextSection title={`Search · ${submitted}`} icon={Search}><div className="space-y-0.5">{results.length ? results.map((item) => <Link key={item.title} to={item.to as never} onClick={() => { setQuery(""); setSubmitted(""); onOpenChange(false); }} className="block rounded-xl px-1.5 py-1.5 hover:bg-elevated"><ContextRow icon={item.icon} title={item.title} detail={item.detail} /></Link>) : <p className="px-1.5 py-2 text-[10.5px] text-muted-foreground">No trusted context found.</p>}</div></ContextSection> : null}</div> : <button type="button" onClick={() => onOpenChange(true)} aria-label="Search trusted context" title="Search trusted context (⌘K)" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"><Search className="size-[17px]" /></button>;
}

function TrustedContextRail({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { work, memory, notifications } = useKurukoo(); const activeWork = work.filter((item) => item.stage !== "done"); const unread = notifications.filter((item) => !item.read).length; const focus = activeWork[0];
  const isWork = pathname === "/work" || pathname.startsWith("/work/"); const isMemory = pathname === "/memory" || pathname.startsWith("/memory/"); const isExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  return <aside aria-label="Trusted context rail" aria-hidden={!open} className={cn("sticky top-0 hidden h-screen flex-col overflow-y-auto border-l border-[#e7e0d7] bg-[#f5f1eb] py-4 transition-[width,padding] duration-200 lg:flex dark:border-border dark:bg-background", open ? "w-[224px] px-3" : "w-[48px] px-1.5")}><div className={cn("mb-2 flex items-center gap-1", open ? "justify-between" : "justify-center")}><button type="button" onClick={() => { setSearchOpen(false); onOpenChange(!open); }} aria-label={open ? "Close trusted context rail" : "Open trusted context rail"} title={open ? "Close trusted context rail" : "Open trusted context rail"} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground">{open ? <PanelLeftClose className="size-[17px] rotate-180" /> : <PanelLeftOpen className="size-[17px] rotate-180" />}</button>{open ? <TrustedContextSearch open={searchOpen} onOpenChange={setSearchOpen} /> : null}</div>{open ? <div className="space-y-3">{/* context sections unchanged */}</div> : null}</aside>;
}

export function EmptyState({ title, body, description }: { title: string; body?: string; description?: string }) { const message = body ?? description; return <div className="rounded-2xl border border-dashed border-border bg-elevated/30 px-5 py-8 text-center"><h2 className="text-[15px] font-semibold">{title}</h2>{message ? <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{message}</p> : null}</div>; }

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); const [trustedOpen, setTrustedOpen] = useState(true); const pathname = useRouterState({ select: (state) => state.location.pathname });
  const grid = trustedOpen ? collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_224px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_224px]" : collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_48px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_48px]";
  return <div className={cn("min-h-screen bg-background md:grid", grid)}>
    <aside aria-label="OS navigation" className={cn("sticky top-0 z-40 hidden h-screen flex-col border-r border-border bg-surface/90 py-6 backdrop-blur transition-[width] duration-200 md:flex", collapsed ? "w-[76px] px-3" : "w-[200px] px-3")}>
      <div className={cn("flex items-center pb-6", collapsed ? "justify-center" : "justify-between px-2")}><Link to="/" className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")} aria-label="Kurukoo Home"><span className="grid size-7 shrink-0 place-items-center rounded-[10px] bg-[#f4e6dc] text-[13px] font-semibold tracking-[-0.02em] text-[#765443]" aria-hidden>K</span>{!collapsed && <span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span>}</Link><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className={cn("grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground", collapsed ? "absolute right-0 top-5 translate-x-1/2 bg-surface opacity-0 hover:opacity-100" : "")} >{collapsed ? <PanelLeftOpen className="size-[17px]" strokeWidth={1.8} /> : <PanelLeftClose className="size-[17px]" strokeWidth={1.8} />}</button></div>
      <nav aria-label="Primary navigation" className="space-y-1">{nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] leading-5 transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ? "bg-elevated font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")} title={collapsed ? label : undefined}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{!collapsed && label}</Link>)}</nav>
      {!collapsed && <><p className="px-3 pb-1 pt-6 text-[10px] font-medium uppercase tracking-[0.14em] leading-4 text-muted-foreground">More</p><nav aria-label="More navigation" className="space-y-1 overflow-y-auto">{more.map(({ to, label, icon: Icon }) => <Link key={to} to={to as never} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] leading-5 transition-colors", pathname.startsWith(to) ? "bg-elevated font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{label}</Link>)}</nav></>}
      <PersonalIdentityDock collapsed={collapsed} />
    </aside>
    <main className="min-w-0 bg-background"><div className="w-full px-5 pb-28 pt-6 md:px-8 md:pb-14 md:pt-8">{children}</div></main>
    <div className="hidden min-w-0 lg:block"><TrustedContextRail open={trustedOpen} onOpenChange={setTrustedOpen} /></div>
  </div>;
}
