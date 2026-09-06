import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Brain,
  Briefcase,
  ChevronDown,
  Compass,
  FolderClosed,
  HeartPulse,
  Home,
  ListChecks,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useKurukoo } from "@/lib/kurukoo-store";

const nav = [
  { to: "/", label: "For You", icon: Home },
  { to: "/chat", label: "Conversation", icon: Sparkles },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/work", label: "Work", icon: ListChecks },
] as const;

const more = [
  { to: "/network", label: "Network", icon: Users },
  { to: "/topics", label: "Topics", icon: Tags },
  { to: "/capabilities", label: "Capabilities", icon: Sparkles },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/artifacts", label: "Files", icon: FolderClosed },
  { to: "/connect", label: "Connect", icon: Plug },
  { to: "/providers", label: "Providers", icon: Users },
  { to: "/businesses", label: "Businesses", icon: Briefcase },
  { to: "/creators", label: "Creators", icon: Sparkles },
  { to: "/advertising", label: "Advertising", icon: Zap },
  { to: "/pricing", label: "Plans", icon: Wallet },
  { to: "/subscriptions", label: "Subscriptions", icon: Wallet },
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
    const nextDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);
  return <button type="button" aria-label={dark ? "Use light appearance" : "Use dark appearance"} onClick={() => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("kurukoo-theme", next ? "dark" : "light"); }} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>;
}

function OsHeader() {
  const profileName = useProfileName();
  const { notifications } = useKurukoo();
  const unread = notifications.filter((item) => !item.read).length;
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const initial = profileName.charAt(0).toUpperCase() || "A";
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = query.trim(); window.location.href = value ? `/explore?query=${encodeURIComponent(value)}` : "/explore"; };
  const logout = () => { localStorage.removeItem("kurukoo-authenticated"); window.dispatchEvent(new Event("kurukoo-auth-updated")); setAccountOpen(false); };
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
    <div className="flex h-[50px] items-center gap-4 px-5 md:px-7 lg:px-8">
      <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Kurukoo For You"><span className="grid size-8 place-items-center rounded-[11px] bg-[#f4e6dc] text-[14px] font-semibold text-[#765443]" aria-hidden>K</span><span className="hidden text-[17px] font-semibold tracking-[-0.025em] sm:inline">Kurukoo</span></Link>
      <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-[520px] flex-1 md:block"><label htmlFor="os-global-search" className="sr-only">Search Kurukoo</label><div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-[var(--shadow-soft)]"><Search className="size-4 shrink-0 text-muted-foreground" /><input id="os-global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Kurukoo anything..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" /><kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground lg:inline">⌘ K</kbd></div></form>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Link to="/wallet" className="rounded-full px-3 py-2 text-[12.5px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground" aria-label="Open wallet and points">1,240 points</Link>
        <Link to="/activity" aria-label={unread ? `${unread} unread notifications` : "Notifications"} className="relative grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"><Bell className="size-[19px]" /><span aria-hidden className={cn("absolute right-[9px] top-[8px] rounded-full", unread ? "grid min-w-2.5 place-items-center bg-destructive px-1 text-[7px] leading-3 text-destructive-foreground" : "size-2 bg-[var(--color-success)]")}>{unread ? (unread > 9 ? "9+" : unread) : null}</span></Link>
        <span className="mx-1 h-8 w-px bg-border" aria-hidden />
        <div className="relative"><button type="button" onClick={() => setAccountOpen((open) => !open)} aria-haspopup="menu" aria-expanded={accountOpen} className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-elevated"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ead7c7] text-[12px] font-semibold text-[#684f3e]">{initial}</span><span className="hidden max-w-[110px] truncate text-[13px] font-medium sm:inline">{profileName}</span><ChevronDown className={cn("size-4 text-muted-foreground transition-transform", accountOpen && "rotate-180")} /></button>{accountOpen ? <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"><Link role="menuitem" to="/profile/$entityId" params={{ entityId: "me" }} onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Profile</Link><Link role="menuitem" to="/memory" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Memory</Link><Link role="menuitem" to="/subscriptions" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Subscriptions</Link><Link role="menuitem" to="/advertising" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Advertise</Link><Link role="menuitem" to="/help" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Help</Link><div className="px-1"><ThemeToggle /></div><button role="menuitem" type="button" onClick={logout} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-[12.5px] text-muted-foreground hover:bg-elevated hover:text-foreground">Log out</button></div> : null}</div>
      </div>
    </div>
    <div className="px-5 pb-3 md:hidden"><form onSubmit={submitSearch}><label htmlFor="os-global-search-mobile" className="sr-only">Search Kurukoo</label><div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3"><Search className="size-4 shrink-0 text-muted-foreground" /><input id="os-global-search-mobile" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Kurukoo" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" /></div></form></div>
  </header>;
}

type ContextIcon = typeof Bookmark;
function ContextSection({ title, icon: Icon, action, to, children }: { title: string; icon: ContextIcon; action?: string; to?: string; children: ReactNode }) { return <section className="rounded-2xl border border-[#e8e1d8] bg-[#fbfaf7] p-3 dark:border-border dark:bg-surface"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Icon className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.8} /><h2 className="truncate text-[13px] font-semibold tracking-tight">{title}</h2></div>{action && to ? <Link to={to as never} aria-label={action} className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="size-4" /></Link> : null}</div><div className="mt-2.5">{children}</div></section>; }
function ContextRow({ icon: Icon, title, detail, tone = "bg-elevated text-muted-foreground" }: { icon: ContextIcon; title: string; detail: string; tone?: string }) { return <div className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5"><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}><Icon className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-[12px] font-medium">{title}</p><p className="truncate text-[10.5px] text-muted-foreground">{detail}</p></div></div>; }
function TrustedContextRail({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) { const pathname = useRouterState({ select: (state) => state.location.pathname }); const { work, memory, notifications } = useKurukoo(); const focus = work.find((item) => item.stage !== "done"); const unread = notifications.filter((item) => !item.read).length; const isWork = pathname === "/work" || pathname.startsWith("/work/"); const isMemory = pathname === "/memory" || pathname.startsWith("/memory/"); const isExplore = pathname === "/explore" || pathname.startsWith("/explore/"); return <aside aria-label="Trusted context rail" aria-hidden={!open} className={cn("sticky top-0 hidden h-[calc(100vh-50px)] flex-col overflow-y-auto border-l border-[#e7e0d7] bg-[#f5f1eb] py-4 dark:border-border dark:bg-background lg:flex", open ? "w-[224px] px-3" : "w-[48px] px-1.5")}><div className={cn("mb-2 flex items-center", open ? "justify-start" : "justify-center")}><button type="button" onClick={() => onOpenChange(!open)} aria-label={open ? "Close trusted context rail" : "Open trusted context rail"} title={open ? "Close trusted context rail" : "Open trusted context rail"} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground">{open ? <PanelLeftClose className="size-[17px] rotate-180" /> : <PanelLeftOpen className="size-[17px] rotate-180" />}</button></div>{open ? <div className="space-y-3"><ContextSection title="Trusted context" icon={Bookmark} action="Open memory" to="/memory"><ContextRow icon={Home} title="For You" detail="Personal workspace" tone="bg-[#eaf2fa] text-[#4d88b8]" /><ContextRow icon={Briefcase} title="Work" detail="Requests and progress" tone="bg-[#f9eadf] text-[#c56d32]" /><ContextRow icon={HeartPulse} title="Health" detail="Private context" tone="bg-[#fae8e6] text-[#d76d61]" /></ContextSection><ContextSection title="Places" icon={MapPin} action="Open places" to="/memory"><ContextRow icon={MapPin} title="Saved places" detail={memory.length ? `${memory.length} saved note${memory.length === 1 ? "" : "s"}` : "Nothing saved yet"} /></ContextSection><ContextSection title="Current work" icon={Briefcase} action="Open work" to="/work">{focus ? <ContextRow icon={Target} title={focus.title} detail={focus.stage === "needs_you" ? "Needs you" : focus.stage === "working" ? "In progress" : "Getting started"} /> : <p className="px-1.5 py-2 text-[10.5px] text-muted-foreground">No active work right now.</p>}</ContextSection><ContextSection title="Attention" icon={Bell} action="Open activity" to="/activity"><ContextRow icon={Bell} title={unread ? `${unread} unread` : "Nothing urgent"} detail={unread ? "Worth a look" : "You're caught up"} /></ContextSection><ContextSection title="Safety" icon={ShieldCheck} action="Open settings" to="/settings"><ContextRow icon={ShieldCheck} title="Trusted handling" detail="Consent before commitments" /></ContextSection>{isWork ? <div className="rounded-xl bg-elevated/45 px-3 py-2 text-[10.5px] text-muted-foreground">You're in Work. The request trail stays available here as you move through the OS.</div> : null}{isMemory ? <div className="rounded-xl bg-elevated/45 px-3 py-2 text-[10.5px] text-muted-foreground">Memory stays attached to useful context rather than becoming a separate archive.</div> : null}{isExplore ? <div className="rounded-xl bg-elevated/45 px-3 py-2 text-[10.5px] text-muted-foreground">Explore connects people, places and ideas back to your active context.</div> : null}</div> : null}</aside>; }

export function AppShell({ children }: { children: ReactNode }) { const [collapsed, setCollapsed] = useState(false); const [trustedOpen, setTrustedOpen] = useState(true); const pathname = useRouterState({ select: (state) => state.location.pathname }); const grid = trustedOpen ? collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_224px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_224px]" : collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_48px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_48px]"; return <div className="min-h-screen bg-background"><OsHeader /><div className={cn("min-h-[calc(100vh-50px)] md:grid", grid)}><aside aria-label="OS navigation" className={cn("sticky top-0 z-40 hidden h-[calc(100vh-50px)] flex-col border-r border-border bg-surface/90 py-6 backdrop-blur transition-[width] duration-200 md:flex", collapsed ? "w-[76px] px-3" : "w-[200px] px-3")}><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className="absolute right-0 top-5 z-10 grid size-9 translate-x-1/2 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-elevated hover:text-foreground">{collapsed ? <PanelLeftOpen className="size-[17px]" strokeWidth={1.8} /> : <PanelLeftClose className="size-[17px]" strokeWidth={1.8} />}</button><nav aria-label="Primary navigation" className="space-y-1">{nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px] leading-5 transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ? "bg-elevated font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")} title={collapsed ? label : undefined}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{!collapsed ? label : null}</Link>)}</nav>{!collapsed ? <><p className="px-3 pb-1 pt-6 text-[10px] font-medium uppercase tracking-[0.14em] leading-4 text-muted-foreground">More</p><nav aria-label="More navigation" className="space-y-1 overflow-y-auto">{more.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] leading-5 transition-colors", pathname.startsWith(to) ? "bg-elevated font-medium text-foreground" : "text-muted-foreground hover:bg-elevated hover:text-foreground")}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{label}</Link>)}</nav></> : null}<div className="mt-auto" /></aside><main className="min-w-0 bg-background"><div className="w-full px-5 pb-28 pt-6 md:px-8 md:pb-14 md:pt-8">{children}</div></main><div className="hidden min-w-0 lg:block"><TrustedContextRail open={trustedOpen} onOpenChange={setTrustedOpen} /></div></div></div>; }

export function PageHeader({ title, description, subtitle, eyebrow, action }: { title?: string; description?: string; subtitle?: string; eyebrow?: string; action?: ReactNode }) { return <header className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ce4712]">{eyebrow ?? "Kurukoo OS"}</p>{title ? <h1 className="mt-1.5 text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">{title}</h1> : null}{(description ?? subtitle) ? <p className="mt-2 max-w-2xl text-[13px] leading-5 text-muted-foreground">{description ?? subtitle}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</header>; }

export function EmptyState({ title, body, description }: { title: string; body?: string; description?: string }) { const message = body ?? description; return <div className="rounded-2xl border border-dashed border-border bg-elevated/30 px-5 py-8 text-center"><h2 className="text-[15px] font-semibold">{title}</h2>{message ? <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{message}</p> : null}</div>; }
