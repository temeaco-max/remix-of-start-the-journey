import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Brain, Briefcase, ChevronDown, ChevronLeft, ChevronRight, Compass, FolderClosed, ListChecks, MapPin, MessageSquare, Moon, Plug, Search, Settings, Sparkles, Sun, Tags, Users, Wallet, Zap } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useKurukoo } from "@/lib/kurukoo-store";
import { fetchPulseReadiness, type PulseReadiness } from "@/lib/kurukoo-api";
import { ContextualTrustedRail } from "@/components/contextual-trusted-rail";
export { EmptyState, PageHeader, useProfileName } from "@/components/app-shell";

const nav = [
  { to: "/desk", label: "For You", icon: Sparkles },
  { to: "/chat", label: "Conversation", icon: MessageSquare },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/discover", label: "Nearby", icon: MapPin },
  { to: "/activity", label: "Activity", icon: Bell },
] as const;
const more = [
  { to: "/work", label: "Work", icon: ListChecks },
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

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { const stored = localStorage.getItem("kurukoo-theme"); const value = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; setDark(value); document.documentElement.classList.toggle("dark", value); }, []);
  return <button type="button" aria-label={dark ? "Use light appearance" : "Use dark appearance"} onClick={() => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("kurukoo-theme", next ? "dark" : "light"); }} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>;
}
function PresenceChip() {
  const [readiness, setReadiness] = useState<PulseReadiness | null>(null);
  useEffect(() => { void fetchPulseReadiness().then(setReadiness).catch(() => setReadiness(null)); }, []);
  const live = Boolean(readiness?.active);
  const eligible = Boolean(readiness?.eligibleToBroadcast);
  return <Link to="/discover" aria-label="Open Nearby availability" className={cn("hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10.5px] font-medium sm:inline-flex", live ? "border-primary/25 bg-brand-tint text-brand-ink" : "border-border bg-surface text-muted-foreground hover:bg-elevated")}><span className={cn("size-1.5 rounded-full", live ? "bg-primary" : "bg-muted-foreground/40")} />{live ? "Live" : eligible ? "Available" : "Nearby"}</Link>;
}
function Header() {
  const profileName = useProfileName();
  const { notifications } = useKurukoo();
  const unread = notifications.filter((n) => !n.read).length;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const value = query.trim(); window.location.href = value ? `/explore?query=${encodeURIComponent(value)}` : "/explore"; };
  const logout = () => { localStorage.removeItem("kurukoo-authenticated"); window.dispatchEvent(new Event("kurukoo-auth-updated")); setOpen(false); };
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur"><div className="flex h-[50px] items-center gap-3 px-5 md:px-7 lg:px-8"><Link to="/desk" className="flex shrink-0 items-center gap-2" aria-label="Kurukoo For You"><span className="grid size-8 place-items-center rounded-[11px] bg-brand-tint text-[14px] font-semibold text-brand-ink">K</span><span className="hidden text-[17px] font-semibold sm:inline">Kurukoo</span></Link><form onSubmit={submit} className="mx-auto hidden w-full max-w-[520px] flex-1 md:block"><div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3"><Search className="size-4 shrink-0 text-muted-foreground"/><input aria-label="Search Kurukoo" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Ask Kurukoo anything..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"/></div></form><div className="ml-auto flex items-center gap-1.5"><PresenceChip/><Link to="/activity" aria-label={unread ? `${unread} unread notifications` : "Notifications"} className="relative grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><Bell className="size-[19px]"/>{unread?<span className="absolute right-[8px] top-[7px] grid min-w-2.5 place-items-center rounded-full bg-destructive px-1 text-[7px] text-destructive-foreground">{unread>9?"9+":unread}</span>:null}</Link><div className="relative"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex items-center gap-1.5 rounded-full px-1 py-1.5 hover:bg-elevated"><span className="grid size-9 place-items-center rounded-full bg-brand-tint text-[12px] font-semibold text-brand-ink">{profileName.charAt(0).toUpperCase()||"A"}</span><ChevronDown className="hidden size-4 text-muted-foreground sm:block"/></button>{open?<div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"><Link to="/memory" onClick={()=>setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Memory</Link><Link to="/settings" onClick={()=>setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-elevated">Settings</Link><ThemeToggle/><button type="button" onClick={logout} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-[12.5px] text-muted-foreground hover:bg-elevated">Log out</button></div>:null}</div></div></div></header>;
}
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed,setCollapsed]=useState(false); const [trustedOpen,setTrustedOpen]=useState(true); const pathname=useRouterState({select:s=>s.location.pathname});
  const grid=trustedOpen ? (collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_224px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_224px]") : (collapsed ? "md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_48px]" : "md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_48px]");
  return <div className="min-h-screen bg-background"><Header/><div className={cn("min-h-[calc(100vh-50px)] md:grid",grid)}><aside className={cn("relative sticky top-0 hidden h-[calc(100vh-50px)] flex-col border-r border-border bg-surface/90 py-0 backdrop-blur md:flex",collapsed?"w-[76px] px-3":"w-[200px] px-3")}><button type="button" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?"Expand navigation":"Collapse navigation"} className="absolute right-0 top-5 z-10 grid size-9 translate-x-1/2 place-items-center rounded-full border border-border bg-surface text-muted-foreground">{collapsed?<ChevronRight className="size-[17px]"/>:<ChevronLeft className="size-[17px]"/>}</button><nav className="space-y-1 pt-6">{nav.map(({to,label,icon:Icon})=><Link key={to} to={to} className={cn("flex items-center rounded-xl py-2.5 text-[13.5px]",collapsed?"justify-center px-2":"gap-3 px-3",pathname===to||pathname.startsWith(`${to}/`)?"bg-elevated font-medium text-foreground":"text-muted-foreground hover:bg-elevated")} title={collapsed?label:undefined}><Icon className="size-[18px]"/>{!collapsed?label:null}</Link>)}</nav>{!collapsed?<><p className="px-3 pb-1 pt-6 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">More</p><nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">{more.map(({to,label,icon:Icon})=><Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px]",pathname.startsWith(to)?"bg-elevated font-medium text-foreground":"text-muted-foreground hover:bg-elevated")}><Icon className="size-[18px]"/>{label}</Link>)}</nav></>:<div className="mt-auto"/>}</aside><main className="min-w-0 bg-background"><div className="w-full px-5 pb-28 pt-6 md:px-8 md:pb-14 md:pt-8">{children}</div></main><ContextualTrustedRail open={trustedOpen} onOpenChange={setTrustedOpen}/></div></div>;
}
