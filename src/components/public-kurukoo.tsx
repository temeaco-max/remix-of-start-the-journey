import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthModal, type AuthMode } from "@/components/kurukoo/auth";
import { PublicRail, RotatingPublicPrompt } from "@/components/public-kurukoo-rail";
import { PublicContextRail } from "@/components/public-kurukoo-context";
import { PublicMobileNavigation } from "@/components/public-kurukoo-mobile-nav";
export { PublicHome } from "@/components/public-kurukoo-home";

const meetKurukoo = [
  ["/agents", "Agentic Storefront"],
  ["/connect", "Channels"],
  ["/capabilities", "Capabilities"],
  ["/discover", "Nearby"],
  ["/opportunities", "Opportunities"],
  ["/advertising", "Advertising"],
] as const;
const forYou = [
  ["/people", "People"],
  ["/providers", "Providers"],
  ["/businesses", "Businesses"],
  ["/creators", "Creators"],
] as const;
const routerDestinations = new Set(["/", "/explore", "/discover", "/how-it-works", "/capabilities", "/topics", "/about", "/blog", "/help", "/login", "/signup", "/contributors", "/partners", "/pricing", "/contact", "/use-cases", "/opportunities", "/advertising", "/providers", "/businesses", "/creators", "/people", "/agents", "/connect"]);
function KurukooMark({ className = "size-6" }: { className?: string }) { return <span aria-hidden className={`grid shrink-0 place-items-center rounded-[10px] bg-brand-tint font-semibold leading-none text-brand-ink ${className}`}>K</span>; }
function PublicDestinationLink({ to, children, className }: { to: string; children: ReactNode; className: string }) { if (!routerDestinations.has(to)) return <a href={to} className={className}>{children}</a>; return <Link to={to as never} className={className}>{children}</Link>; }
function PublicMenu({ label, items }: { label: string; items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [open]);
  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">{label}<ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open ? <div className="absolute left-1/2 top-[calc(100%+12px)] z-[70] w-[250px] -translate-x-1/2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)]">{items.map(([to, item]) => <Link key={to} to={to as never} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-elevated"><span className="block text-[12px] font-medium text-foreground">{item}</span></Link>)}</div> : null}</div>;
}
export function PublicKurukooShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname }); const navigate = useNavigate(); const routeMode: AuthMode | null = pathname === "/login" ? "login" : pathname === "/signup" ? "signup" : null; const [authMode, setAuthMode] = useState<AuthMode | null>(routeMode); const [railCollapsed, setRailCollapsed] = useState(false); useEffect(() => { setAuthMode(routeMode); }, [routeMode]); const openAuth = (mode: AuthMode) => setAuthMode(mode); const closeAuth = () => { setAuthMode(null); if (routeMode) navigate({ to: "/" }); };
  return <div className="min-h-screen overflow-hidden bg-background">
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur"><div className="relative flex h-[50px] items-center px-5 md:px-7 lg:px-8"><Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Kurukoo home"><KurukooMark className="size-8"/><span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span></Link><nav aria-label="Kurukoo" className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-7 text-[12.5px] text-muted-foreground md:flex"><PublicMenu label="Meet Kurukoo" items={meetKurukoo}/><PublicDestinationLink to="/how-it-works" className="transition-colors hover:text-foreground">How it works</PublicDestinationLink><PublicDestinationLink to="/explore" className="transition-colors hover:text-foreground">Explore</PublicDestinationLink><PublicMenu label="For You" items={forYou}/><PublicDestinationLink to="/topics" className="transition-colors hover:text-foreground">Community</PublicDestinationLink><RotatingPublicPrompt/></nav><div className="ml-auto flex items-center gap-2"><button type="button" onClick={()=>openAuth("login")} className="rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">Log In</button><button type="button" onClick={()=>openAuth("signup")} className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">Try for free</button></div></div></header>
    <div className={`h-[calc(100vh-50px)] min-h-0 overflow-hidden md:grid ${railCollapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[200px_minmax(0,1fr)]"}`}>
      <PublicRail collapsed={railCollapsed} onToggle={()=>setRailCollapsed((value)=>!value)} onAuth={openAuth}/>
      <div className="min-h-0 h-full overflow-y-auto scrollbar-none"><div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_224px]"><main className="flex min-w-0 min-h-full flex-col"><div className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-9 md:px-8 md:py-12">{children}</div><footer className="sticky bottom-0 z-20 mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-5 py-7 text-[11px] text-muted-foreground backdrop-blur md:px-8"><p>Kurukoo · conversation-first coordination</p><nav aria-label="Information"><div className="flex flex-wrap gap-x-4 gap-y-2">{[["/about","About"],["/blog","Blog"],["/help","Help"],["/legal","Legal"]].map(([to,label])=><PublicDestinationLink key={to} to={to} className="hover:text-foreground">{label}</PublicDestinationLink>)}</div></nav></footer></main><aside className="hidden min-w-0 border-l border-border/45 lg:block"><PublicContextRail/></aside></div></div>
    </div>
    <PublicMobileNavigation onAuth={openAuth}/>{authMode?<AuthModal mode={authMode} onClose={closeAuth} onModeChange={setAuthMode}/>:null}
  </div>;
}
