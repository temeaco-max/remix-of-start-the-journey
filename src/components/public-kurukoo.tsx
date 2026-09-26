import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Globe, Moon, Sun } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthModal, type AuthMode } from "@/components/kurukoo/auth";
import { getKurukooAuthState, logoutKurukoo } from "@/lib/kurukoo-auth";
import { getLocale, setLocale, KURUKOO_LOCALES, type KurukooLocale } from "@/lib/kurukoo-locale";
import { PublicRail, RotatingPublicPrompt } from "@/components/public-kurukoo-rail";
import { PublicContextRail } from "@/components/public-kurukoo-context";
import { PublicMobileNavigation } from "@/components/public-kurukoo-mobile-nav";
export { PublicHome } from "@/components/public-kurukoo-home";
const productFeatures = [
  {
    heading: "Features",
    items: [
      ["/chat", "Chat / Voice", "Talk to Kurukoo in your own words."],
      ["/capabilities", "Capabilities", "From reminders to rides — Kurukoo routes and executes."],
      ["/work", "Work in progress", "Track what Kurukoo is handling for you."],
      ["/field", "Your Field", "Your personal workspace for conversation, work, and context."],
      ["/how-it-works", "How it works", "See how Kurukoo turns conversation into outcome."],
    ],
  },
] as const;
const productResources = [
  {
    heading: "Resources",
    items: [
      ["/help", "Help", "Get answers to common questions."],
      ["/blog", "Blog", "Thoughts on AI and everyday work."],
      [
        "/legal/privacy",
        "Privacy & safety",
        "How your data, credentials, and actions are protected.",
      ],
      ["/legal", "Legal", "Terms, cookies, and policies."],
    ],
  },
] as const;
const routerDestinations = new Set([
  "/",
  "/explore",
  "/discover",
  "/network",
  "/ad-campaign",
  "/trust",
  "/how-it-works",
  "/capabilities",
  "/topics",
  "/about",
  "/blog",
  "/help",
  "/login",
  "/signup",
  "/pricing",
  "/contact",
  "/opportunities",
  "/provider",
  "/agents",
  "/kurukoo-ai",
  "/connect",
  "/integrations",
  "/resources",
  "/legal",
  "/cookies",
  "/chat",
  "/work",
  "/memory",
  "/activity",
  "/notifications",
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
  onClick,
}: {
  to: string;
  children: ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return routerDestinations.has(to) ? (
    <Link to={to as never} onClick={onClick} className={className}>
      {children}
    </Link>
  ) : (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
function PublicMenu({
  label,
  kind,
  items,
  railCollapsed,
}: {
  label: string;
  kind: "product" | "resources";
  items: readonly unknown[];
  railCollapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `public-menu-${kind}`;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        (triggerRef.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);
  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-x-0 bottom-0 top-[50px] z-[60] bg-foreground/5"
            />
            <div
              ref={menuRef}
              role="menu"
              id={menuId}
              className="fixed top-[50px] z-[70] max-h-[calc(100vh-50px)] overflow-y-auto border-b border-border/80 bg-surface/98 shadow-[0_24px_70px_rgba(0,0,0,0.12)] backdrop-blur-xl"
              style={{ left: railCollapsed ? 76 : 200, right: 224 }}
            >
              <div className="mx-auto w-full max-w-[1160px] px-6 py-7 md:px-9">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
                  {(items as typeof productFeatures).map((column) => (
                    <div key={column.heading ?? "items"} className="min-w-0">
                      <p
                        className={`mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${column.heading ? "" : "invisible"}`}
                        aria-hidden={column.heading ? undefined : true}
                      >
                        {column.heading || "Features"}
                      </p>
                      <div className="border-t border-border/60">
                        {column.items.map(([to, title, desc]) => (
                          <PublicDestinationLink
                            key={`${to}-${title}`}
                            to={to}
                            onClick={() => setOpen(false)}
                            className="group block border-b border-border/50 px-1 py-3 text-[12px] font-medium text-foreground transition-colors last:border-b-0 hover:text-muted-foreground"
                          >
                            <div className="flex flex-col">
                              <span className="text-foreground group-hover:text-muted-foreground">
                                {title}
                              </span>
                              {desc ? (
                                <span className="mt-0.5 max-w-[260px] text-[10.5px] text-muted-foreground">
                                  {desc}
                                </span>
                              ) : null}
                            </div>
                          </PublicDestinationLink>
                        ))}
                      </div>
                    </div>
                  ))}
                  {kind === "product" ? (
                    <div className="min-w-0 border-l border-border/60 pl-6">
                      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        See it in action
                      </p>
                      <Link
                        to="/resources/$slug"
                        params={{ slug: "how-kurukoo-works" }}
                        onClick={() => setOpen(false)}
                        className="group block overflow-hidden border border-border bg-foreground text-background"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-[radial-gradient(circle_at_72%_22%,color-mix(in_oklch,var(--brand-tint)_70%,transparent),transparent_32%),linear-gradient(145deg,var(--foreground),color-mix(in_oklch,var(--foreground)_78%,var(--primary)))]">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="grid size-11 place-items-center bg-background/12 ring-1 ring-background/20 backdrop-blur transition-transform group-hover:scale-105">
                              <span className="ml-1 border-y-[7px] border-y-transparent border-l-[10px] border-l-background" />
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground to-transparent px-3 pb-3 pt-10">
                            <p className="text-[12px] font-semibold">How Kurukoo works</p>
                            <p className="mt-0.5 text-[9.5px] text-background/70">
                              A quick visual guide to the journey.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5 text-[9.5px] text-background/70">
                          <span>Watch the guide</span>
                          <span>↗</span>
                        </div>
                      </Link>
                    </div>
                  ) : null}
                </div>
                {kind === "resources" ? (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {(items as typeof productResources).map((column) => (
                      <div key={column.heading ?? "resources"} className="min-w-0">
                        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {column.heading || "Resources"}
                        </p>
                        <div className="border-t border-border/60">
                          {column.items.map(([to, title, desc]) => (
                            <PublicDestinationLink
                              key={`${to}-${title}`}
                              to={to}
                              onClick={() => setOpen(false)}
                              className="group block border-b border-border/50 px-1 py-3 text-[12px] font-medium text-foreground transition-colors last:border-b-0 hover:text-muted-foreground"
                            >
                              <div className="flex flex-col">
                                <span className="text-foreground group-hover:text-muted-foreground">
                                  {title}
                                </span>
                                {desc ? (
                                  <span className="mt-0.5 max-w-[260px] text-[10.5px] text-muted-foreground">
                                    {desc}
                                  </span>
                                ) : null}
                              </div>
                            </PublicDestinationLink>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-7 flex items-center justify-between border-t border-border/60 pt-4">
                  <p className="text-[10.5px] text-muted-foreground">
                    {kind === "product"
                      ? "Explore the parts of Kurukoo that help you get things done."
                      : "Learn how Kurukoo works, the tools it can use, and how your data stays yours."}
                  </p>
                  <PublicDestinationLink
                    to={kind === "product" ? "/how-it-works" : "/help"}
                    onClick={() => setOpen(false)}
                    className="text-[10.5px] font-medium text-foreground hover:opacity-70"
                  >
                    {kind === "product" ? "How it works" : "Help"}
                  </PublicDestinationLink>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;
  return (
    <div ref={triggerRef} className="relative h-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        className={`group relative inline-flex h-full items-center gap-1.5 transition-colors ${open || kind === "product" ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
        {kind === "product" ? (
          <span
            className={`absolute inset-x-0 bottom-0 h-px bg-foreground transition-opacity ${open ? "opacity-100" : "opacity-30 group-hover:opacity-70"}`}
          />
        ) : null}
      </button>
      {menu}
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
      className="grid size-9 place-items-center text-muted-foreground hover:text-foreground"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem("kurukoo-pwa-dismissed") === "true") setDismissed(true);
    } catch {}
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  if (!deferred || dismissed) return null;
  const dismiss = () => {
    try {
      window.localStorage.setItem("kurukoo-pwa-dismissed", "true");
    } catch {}
    setDismissed(true);
  };
  const install = () => {
    void deferred.prompt().finally(dismiss);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-lift)]">
        <p className="min-w-0 flex-1 text-[12.5px]">
          <span className="font-medium text-foreground">Install Kurukoo. </span>
          <span className="text-muted-foreground">Faster entry, offline shell, home-screen chat.</span>
        </p>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-[12px] font-medium text-primary-foreground"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-elevated"
        >
          ×
        </button>
      </div>
    </div>
  );
}
export function PublicKurukooShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const routeMode: AuthMode | null =
    pathname === "/login" ? "login" : pathname === "/signup" ? "signup" : null;
  const [authMode, setAuthMode] = useState<AuthMode | null>(routeMode);
  const [signedIn, setSignedIn] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const isPublicHome = pathname === "/";
  useEffect(() => {
    setAuthMode(routeMode);
  }, [routeMode]);
  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      const state = await getKurukooAuthState();
      if (cancelled) return;
      setSignedIn(state.authenticated);
      setAccountName(String(state.user?.name || state.user?.email || "").trim() || null);
    };
    void read();
    window.addEventListener("kurukoo-auth-updated", read);
    return () => { cancelled = true; window.removeEventListener("kurukoo-auth-updated", read); };
  }, []);
  const openAuth = (mode: AuthMode) => setAuthMode(mode);
  const closeAuth = () => {
    setAuthMode(null);
    if (routeMode) navigate({ to: "/" });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="relative flex h-[50px] items-center px-5 md:px-7 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Kurukoo home">
            <KurukooMark className="size-6" />
            <span className="text-[17px] font-semibold tracking-[-0.025em]">Kurukoo</span>
          </Link>
          <nav
            aria-label="Kurukoo"
            className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center justify-center gap-8 text-[12.5px] md:flex"
          >
            <PublicMenu
              label="Product"
              kind="product"
              items={productFeatures}
              railCollapsed={railCollapsed}
            />
            <PublicMenu
              label="Resources"
              kind="resources"
              items={productResources}
              railCollapsed={railCollapsed}
            />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <RotatingPublicPrompt />
            <PublicThemeToggle />
            {signedIn ? (
              <div className="relative">
                <button type="button" onClick={() => setAccountMenuOpen((value) => !value)} aria-haspopup="menu" aria-expanded={accountMenuOpen} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-medium hover:bg-elevated">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-tint font-semibold text-brand-ink">{(accountName || "K").charAt(0).toUpperCase()}</span>
                  <span className="max-w-32 truncate">{accountName || "Your account"}</span>
                  <ChevronDown className={`size-3 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {accountMenuOpen ? <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                  <Link role="menuitem" to="/field" className="block rounded-lg px-3 py-2 text-[12px] hover:bg-elevated">Open Kurukoo</Link>
                  <Link role="menuitem" to="/settings" className="block rounded-lg px-3 py-2 text-[12px] hover:bg-elevated">Account settings</Link>
                  <button role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); void logoutKurukoo().then(() => { window.location.href = "/"; }); }} className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-elevated">Log out</button>
                </div> : null}
              </div>
            ) : (
              <>
                <button type="button" onClick={() => openAuth("login")} className="px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground">Log In</button>
                <button type="button" onClick={() => openAuth("signup")} className="bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground">Try for free</button>
              </>
            )}
          </div>
        </div>
      </header>
      <div
        className={`min-h-[calc(100vh-50px)] md:grid ${isPublicHome ? "md:grid-cols-1" : railCollapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[200px_minmax(0,1fr)]"}`}
      >
        {!isPublicHome ? (
          <PublicRail
            collapsed={railCollapsed}
            onToggle={() => setRailCollapsed((v) => !v)}
            onAuth={openAuth}
          />
        ) : null}
        <div className="min-w-0">
          <div
            className={
              isPublicHome
                ? "min-h-0"
                : "grid min-h-[calc(100vh-50px)] lg:grid-cols-[minmax(0,1fr)_224px]"
            }
          >
            <main className="flex min-w-0 flex-col">
              <div
                className={`mx-auto w-full max-w-[1160px] flex-1 px-5 md:px-9 ${isPublicHome ? "py-4 md:py-5" : "py-8 md:py-10"}`}
              >
                {children}
              </div>
              <footer className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 border-t border-border/60 px-5 py-5 text-[11px] text-muted-foreground md:px-9">
                <p className="flex shrink-0 items-center gap-2">
                  <img
                    src={canonicalLogo}
                    alt="Kurukoo"
                    className="size-4 object-contain"
                    width="16"
                    height="16"
                  />
                  <span>© 2026 Kurukoo · Everyday AI that gets things done.</span>
                </p>
                <LocaleSwitcher />
                <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                  <nav aria-label="Information and legal">
                    <div className="flex flex-wrap justify-end gap-x-4 gap-y-2">
                      <PublicDestinationLink to="/about" className="hover:text-foreground">
                        About
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/capabilities" className="hover:text-foreground">
                        Capabilities
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/pricing" className="hover:text-foreground">
                        Pricing
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/help" className="hover:text-foreground">
                        Help
                      </PublicDestinationLink>
                      <PublicDestinationLink
                        to="/legal"
                        className="font-medium text-foreground hover:opacity-80"
                      >
                        Legal & policies
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/legal/privacy" className="hover:text-foreground">
                        Privacy
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/legal/terms" className="hover:text-foreground">
                        Terms
                      </PublicDestinationLink>
                      <PublicDestinationLink to="/legal/cookies" className="hover:text-foreground">
                        Cookies
                      </PublicDestinationLink>
                    </div>
                  </nav>
                </div>
              </footer>
            </main>
            {!isPublicHome ? (
              <aside className="hidden min-w-0 border-l border-border/45 lg:block">
                <PublicContextRail signedIn={signedIn} onOpenAuth={openAuth} />
              </aside>
            ) : null}
          </div>
        </div>
      </div>
      <PublicMobileNavigation onAuth={openAuth} />
      <InstallPrompt />
      {authMode ? (
        <AuthModal mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} />
      ) : null}
    </div>
  );
}

// Locale switcher component for GB/NG switching (default GB)
function LocaleSwitcher() {
  const [open, setOpen] = useState(false);
  const locales = KURUKOO_LOCALES;
  const current: KurukooLocale = getLocale();
  const currentLocale = locales.find((l) => l.code === current) || locales[0];

  const handleChange = (code: KurukooLocale) => {
    setLocale(code);
    // Reload to apply new locale
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Switch country"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Globe className="size-3.5" aria-hidden="true" />
        <span className="flex items-center gap-1">
          <span className="text-[13px]">{currentLocale.flag}</span>
          <span className="uppercase font-medium">{currentLocale.code}</span>
          <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[140px] rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)] animate-in fade-in-0 zoom-in-95 duration-150">
            {locales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleChange(locale.code)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors ${
                  locale.code === current ? "bg-elevated text-foreground" : ""
                }`}
              >
                <span className="text-[16px]">{locale.flag}</span>
                <span className="font-medium uppercase">{locale.code}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{locale.currency}</span>
                {locale.code === current && (
                  <span className="ml-1 size-3.5 text-primary" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
