import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Moon, Sun } from "lucide-react";
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
  ["/resources", "Resources"],
] as const;
const forYou = [
  ["/people", "People"],
  ["/providers", "Providers"],
  ["/businesses", "Businesses"],
  ["/creators", "Creators"],
] as const;
const routerDestinations = new Set([
  "/",
  "/explore",
  "/discover",
  "/how-it-works",
  "/capabilities",
  "/topics",
  "/about",
  "/blog",
  "/help",
  "/login",
  "/signup",
  "/contributors",
  "/partners",
  "/pricing",
  "/contact",
  "/use-cases",
  "/opportunities",
  "/advertising",
  "/providers",
  "/businesses",
  "/creators",
  "/people",
  "/agents",
  "/connect",
  "/resources",
  "/legal",
  "/cookies",
]);
const canonicalLogo =
  "https://raw.githubusercontent.com/temeaco-max/kurukoo/ca35abf26b6b07fa234f6b986bd7a52e4e718f86/public/assets/brand/logo-icon.png";
function KurukooMark({ className = "size-6" }: { className?: string }) {
  return (
    <img
      src={canonicalLogo}
      alt="Kurukoo"
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
      width="32"
      height="32"
    />
  );
}
function PublicDestinationLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className: string;
}) {
  return routerDestinations.has(to) ? (
    <Link to={to as never} className={className}>
      {children}
    </Link>
  ) : (
    <a href={to} className={className}>
      {children}
    </a>
  );
}
function PublicMenu({
  label,
  items,
}: {
  label: string;
  items: readonly (readonly [string, string])[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform dark:text-primary ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-1/2 top-[calc(100%+12px)] z-[70] w-[250px] -translate-x-1/2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)]">
          {items.map(([to, item]) => (
            <PublicDestinationLink
              key={to}
              to={to}
              className="block rounded-xl px-3 py-2.5 hover:bg-elevated"
            >
              <span className="block text-[12px] font-medium text-foreground">{item}</span>
            </PublicDestinationLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
function PublicThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("kurukoo-theme");
    const value = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kurukoo-theme", next ? "dark" : "light");
      }}
      aria-label={dark ? "Use day mode" : "Use night mode"}
      title={dark ? "Switch to day mode" : "Switch to night mode"}
      className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
export function PublicKurukooShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const routeMode: AuthMode | null =
    pathname === "/login" ? "login" : pathname === "/signup" ? "signup" : null;
  const [authMode, setAuthMode] = useState<AuthMode | null>(routeMode);
  const [signedIn, setSignedIn] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  useEffect(() => {
    setAuthMode(routeMode);
  }, [routeMode]);
  useEffect(() => {
    const read = () => setSignedIn(localStorage.getItem("kurukoo-authenticated") === "true");
    read();
    window.addEventListener("kurukoo-auth-updated", read);
    return () => window.removeEventListener("kurukoo-auth-updated", read);
  }, []);
  const openAuth = (mode: AuthMode) => setAuthMode(mode);
  const closeAuth = () => {
    setAuthMode(null);
    if (routeMode) navigate({ to: "/" });
  };
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="relative flex h-[50px] items-center px-5 md:px-7 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Kurukoo home">
            <KurukooMark className="size-8" />
            <span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span>
          </Link>
          <nav
            aria-label="Kurukoo"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-7 text-[12.5px] text-muted-foreground md:flex"
          >
            <PublicMenu label="Meet Kurukoo" items={meetKurukoo} />
            <PublicDestinationLink to="/how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </PublicDestinationLink>
            <PublicDestinationLink to="/explore" className="transition-colors hover:text-foreground">
              Explore
            </PublicDestinationLink>
            <PublicMenu label="For You" items={forYou} />
            <PublicDestinationLink to="/topics" className="transition-colors hover:text-foreground">
              Community
            </PublicDestinationLink>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <RotatingPublicPrompt />
            <PublicThemeToggle />
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground"
            >
              Try for free
            </button>
          </div>
        </div>
      </header>
      <div
        className={`h-[calc(100vh-50px)] min-h-0 overflow-hidden md:grid ${railCollapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[200px_minmax(0,1fr)]"}`}
      >
        <PublicRail collapsed={railCollapsed} onToggle={() => setRailCollapsed((v) => !v)} onAuth={openAuth} />
        <div className="min-h-0 h-full overflow-y-auto scrollbar-none">
          <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_224px]">
            <main className="flex min-w-0 min-h-full flex-col">
              <div className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-9 md:px-8 md:py-12">
                {children}
              </div>
              <footer className="sticky bottom-0 z-20 mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 border-t border-border/60 bg-background/95 px-5 py-5 text-[11px] text-muted-foreground backdrop-blur md:px-8">
                <p className="flex shrink-0 items-center gap-2">
                  <img src={canonicalLogo} alt="Kurukoo" className="size-4 object-contain" width="16" height="16" />
                  <span>© 2026 Kurukoo OS · Everyday AI OS for real life.</span>
                </p>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/80">Prototype build</span>
                  <nav aria-label="Information and legal">
                    <div className="flex flex-wrap justify-end gap-x-4 gap-y-2">
                      <PublicDestinationLink to="/about" className="hover:text-foreground">About</PublicDestinationLink>
                      <PublicDestinationLink to="/help" className="hover:text-foreground">Help</PublicDestinationLink>
                      <PublicDestinationLink to="/legal" className="font-medium text-foreground hover:opacity-80">Legal & policies</PublicDestinationLink>
                      <PublicDestinationLink to="/legal/privacy" className="hover:text-foreground">Privacy</PublicDestinationLink>
                      <PublicDestinationLink to="/legal/terms" className="hover:text-foreground">Terms</PublicDestinationLink>
                      <PublicDestinationLink to="/legal/cookies" className="hover:text-foreground">Cookies</PublicDestinationLink>
                    </div>
                  </nav>
                </div>
              </footer>
            </main>
            <aside className="hidden min-w-0 border-l border-border/45 lg:block">
              <PublicContextRail signedIn={signedIn} onOpenAuth={openAuth} />
            </aside>
          </div>
        </div>
      </div>
      <PublicMobileNavigation onAuth={openAuth} />
      {authMode ? <AuthModal mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} /> : null}
    </div>
  );
}
