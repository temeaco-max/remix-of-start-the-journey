import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AuthModal, type AuthMode } from "@/components/kurukoo/auth";
import { PublicRail } from "@/components/public-kurukoo-rail";
import { PublicContextRail } from "@/components/public-kurukoo-context";
import { PublicMobileNavigation } from "@/components/public-kurukoo-mobile-nav";
export { PublicHome } from "@/components/public-kurukoo-home";

const nav = [["/explore", "Explore"], ["/how-it-works", "How it works"], ["/capabilities", "Capabilities"], ["/topics", "Topics"]] as const;
const footer = [["/about", "About"], ["/blog", "Blog"], ["/help", "Help"], ["/legal", "Legal"]] as const;
const routerDestinations = new Set(["/explore", "/capabilities", "/topics", "/about", "/blog", "/help", "/login", "/signup"]);

function KurukooMark({ className = "size-6" }: { className?: string }) {
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-[10px] bg-[#f4e6dc] font-semibold leading-none text-[#765443] ${className}`}>K</span>;
}

function PublicDestinationLink({
  to,
  children,
  className,
  active = false,
}: {
  to: string;
  children: ReactNode;
  className: string;
  active?: boolean;
}) {
  if (!routerDestinations.has(to)) return <a href={to} className={className}>{children}</a>;
  if (active) {
    return <Link to={to as never} activeProps={{ className: "text-foreground" }} className={className}>{children}</Link>;
  }
  return <Link to={to as never} className={className}>{children}</Link>;
}

export function PublicKurukooShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const routeMode: AuthMode | null = pathname === "/login" ? "login" : pathname === "/signup" ? "signup" : null;
  const [authMode, setAuthMode] = useState<AuthMode | null>(routeMode);
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    setAuthMode(routeMode);
  }, [routeMode]);

  const openAuth = (mode: AuthMode) => setAuthMode(mode);
  const closeAuth = () => {
    setAuthMode(null);
    if (routeMode) navigate({ to: "/" });
  };

  return <div className="min-h-screen bg-background">
    <PublicRail collapsed={railCollapsed} onToggle={() => setRailCollapsed((value) => !value)} onAuth={openAuth} />
    <PublicMobileNavigation onAuth={openAuth} />
    <div className={`flex min-h-screen transition-[padding] duration-200 ${railCollapsed ? "pl-0 md:pl-[76px]" : "pl-0 md:pl-[200px]"}`}>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur">
          <div className="relative mx-auto flex h-12 w-full items-center px-5 lg:px-7">
            <Link to="/" className="absolute left-5 flex items-center gap-2 font-semibold tracking-[-0.025em] md:hidden"><KurukooMark />Kurukoo</Link>
            <nav aria-label="Kurukoo" className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-7 text-[12.5px] text-muted-foreground md:flex lg:left-[calc(50%-112px)] lg:-translate-x-1/2">
              {nav.map(([to, label]) => <PublicDestinationLink key={to} to={to} active className="transition-colors hover:text-foreground">{label}</PublicDestinationLink>)}
            </nav>
            <div className="absolute right-5 flex items-center gap-2">
              <button type="button" onClick={() => openAuth("login")} className="rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">Log In</button>
              <button type="button" onClick={() => openAuth("signup")} className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">Try for free</button>
            </div>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-49px)] items-stretch">
          <div className="min-w-0 flex-1">
            {children}
            <footer className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-7 text-[11px] text-muted-foreground md:px-8">
              <p>Kurukoo · conversation-first coordination</p>
              <nav aria-label="Information"><div className="flex flex-wrap gap-x-4 gap-y-2">{footer.map(([to, label]) => <PublicDestinationLink key={to} to={to} className="hover:text-foreground">{label}</PublicDestinationLink>)}</div></nav>
            </footer>
          </div>
          <div className="hidden w-px bg-border/45 lg:block" aria-hidden />
          <PublicContextRail />
        </div>
      </main>
    </div>
    {authMode ? <AuthModal mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} /> : null}
  </div>;
}
