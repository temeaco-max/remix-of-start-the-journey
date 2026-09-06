import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts } from "@tanstack/react-router";
import { Bell, MoreHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell, useProfileName } from "../components/app-shell";
import { PublicHome, PublicKurukooShell } from "../components/public-kurukoo";
import { KurukooProvider, useKurukoo } from "@/lib/kurukoo-store";

const publicSurfacePrefixes = ["/about", "/blog", "/capabilities", "/contributors", "/contact", "/explore", "/help", "/how-it-works", "/legal", "/login", "/partners", "/pricing", "/signup", "/topics", "/use-cases", "/opportunities", "/advertising"];
const publicAuthRoutes = new Set(["/login", "/signup"]);
const authenticatedMoreItems = [
  ["/work", "Work"], ["/topics", "Topics"], ["/capabilities", "Capabilities"], ["/providers", "Providers"],
  ["/businesses", "Businesses"], ["/creators", "Creators"], ["/advertising", "Advertising"], ["/pricing", "Plans"],
  ["/subscriptions", "Subscriptions"], ["/wallet", "Wallet"], ["/memory", "Memory"], ["/messages", "Messages"],
  ["/contacts", "Contacts"], ["/connect", "Connect"], ["/settings", "Settings"],
] as const;

function NotFoundComponent() { return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2><p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p><div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Go home</Link></div></div></div>; }
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) { console.error(error); const router = useRouter(); useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]); return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1><p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button><a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Go home</a></div></div></div>; }

function AuthenticatedHeader() {
  const profileName = useProfileName();
  const { notifications } = useKurukoo();
  const unread = notifications.filter((item) => !item.read).length;
  const [greeting, setGreeting] = useState("Good day");
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setDateLabel(new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(now));
  }, []);
  return <header className="-mx-5 -mt-6 mb-6 flex h-12 items-center justify-between border-b border-border/70 bg-background/92 px-5 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
    <div className="min-w-0"><p className="truncate text-[12px] font-medium text-muted-foreground">{dateLabel}</p><p className="truncate text-[14px] font-semibold tracking-tight text-foreground">{greeting}, {profileName}</p></div>
    <Link to="/activity" aria-label={unread ? `${unread} unread notifications` : "Activity"} title="Activity" className="relative grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"><Bell className="size-[18px]" strokeWidth={1.8} />{unread ? <span className="absolute right-1 top-1 grid min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[8px] font-semibold leading-3 text-primary-foreground">{unread > 9 ? "9+" : unread}</span> : null}</Link>
  </header>;
}

function AuthenticatedMobileBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { setMoreOpen(false); }, [pathname]);
  return <>
    {moreOpen ? <button type="button" aria-label="Close more navigation" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-[49] bg-foreground/10 backdrop-blur-[1px] md:hidden" /> : null}
    {moreOpen ? <div className="fixed inset-x-3 bottom-[68px] z-[51] max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)] md:hidden"><nav aria-label="More navigation" className="grid grid-cols-2 gap-1">{authenticatedMoreItems.map(([to,label]) => <Link key={to} to={to} className="rounded-xl px-3 py-2.5 text-[12.5px] text-muted-foreground hover:bg-elevated hover:text-foreground">{label}</Link>)}</nav></div> : null}
    <div className="fixed inset-x-0 bottom-0 z-[50] border-t border-border bg-surface/98 backdrop-blur md:hidden"><div className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
      <Link to="/" className={`grid place-items-center rounded-xl px-1 py-2 text-[10px] leading-4 ${pathname === "/" ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><span className="text-[17px] leading-4">⌂</span>Home</Link>
      <Link to="/chat" className={`grid place-items-center rounded-xl px-1 py-2 text-[10px] leading-4 ${pathname === "/chat" ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><span className="text-[17px] leading-4">✦</span>Conversation</Link>
      <Link to="/explore" className={`grid place-items-center rounded-xl px-1 py-2 text-[10px] leading-4 ${pathname.startsWith("/explore") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><span className="text-[17px] leading-4">⌕</span>Explore</Link>
      <Link to="/activity" className={`grid place-items-center rounded-xl px-1 py-2 text-[10px] leading-4 ${pathname.startsWith("/activity") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><Bell className="size-[17px]" strokeWidth={1.8} />Activity</Link>
      <button type="button" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen} className={`grid place-items-center rounded-xl px-1 py-2 text-[10px] leading-4 ${moreOpen ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><MoreHorizontal className="size-[17px]" strokeWidth={1.8} />More</button>
    </div></div>
  </>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({ head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { title: "Kurukoo" }, { name: "description", content: "Tell Kurukoo what you need and it gets it done." }, { property: "og:title", content: "Kurukoo" }, { property: "og:description", content: "A conversation-first assistant that gets things done." }, { property: "og:type", content: "website" }], links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" }, { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }] }), shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent });
function RootShell({ children }: { children: ReactNode }) { return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function RootComponent() { const { queryClient } = Route.useRouteContext(); const pathname = useRouterState({ select: (state) => state.location.pathname }); const [authenticated, setAuthenticated] = useState(false); useEffect(() => { const read = () => setAuthenticated(localStorage.getItem("kurukoo-authenticated") === "true"); read(); window.addEventListener("storage", read); window.addEventListener("kurukoo-auth-updated", read); return () => { window.removeEventListener("storage", read); window.removeEventListener("kurukoo-auth-updated", read); }; }, []); const isPublicSurface = publicSurfacePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)); const isAnonymousHome = pathname === "/" && !authenticated; const usePublicShell = !authenticated && (isPublicSurface || isAnonymousHome || publicAuthRoutes.has(pathname)); const savePublicPrompt = (prompt: string) => { localStorage.setItem("kurukoo-chat-draft", prompt); }; return <QueryClientProvider client={queryClient}><KurukooProvider>{usePublicShell ? <PublicKurukooShell>{isAnonymousHome ? <PublicHome onSend={savePublicPrompt} /> : <Outlet />}</PublicKurukooShell> : <AppShell><AuthenticatedHeader /><Outlet /><AuthenticatedMobileBar /></AppShell>}</KurukooProvider></QueryClientProvider>; }
