import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts } from "@tanstack/react-router";
import { Bell, Home, Compass, MoreHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/app-shell";
import { PublicHome, PublicKurukooShell } from "../components/public-kurukoo";
import { KurukooProvider } from "@/lib/kurukoo-store";

const publicSurfacePrefixes = ["/about", "/blog", "/capabilities", "/contributors", "/contact", "/explore", "/help", "/how-it-works", "/legal", "/login", "/partners", "/pricing", "/providers", "/businesses", "/creators", "/advertising", "/signup", "/topics", "/use-cases", "/opportunities", "/safety"] as const;
const authenticatedMoreItems = [["/work", "Work"], ["/topics", "Topics"], ["/capabilities", "Capabilities"], ["/providers", "Providers"], ["/businesses", "Businesses"], ["/creators", "Creators"], ["/advertising", "Advertising"], ["/pricing", "Plans"], ["/subscriptions", "Subscriptions"], ["/wallet", "Wallet"], ["/memory", "Memory"], ["/messages", "Messages"], ["/contacts", "Contacts"], ["/connect", "Connect"], ["/safety", "Safety"], ["/settings", "Settings"]] as const;

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2><p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p><div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Go home</Link></div></div></div>;
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1><p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Try again</button><a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Go home</a></div></div></div>;
}
function AuthenticatedMobileBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  return <><div className="fixed inset-x-0 bottom-0 z-[50] border-t border-border bg-surface/98 backdrop-blur md:hidden"><nav aria-label="Mobile navigation" className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2"><Link to="/desk" className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] leading-4 ${pathname === "/desk" || pathname === "/" ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><Home className="size-[17px]" strokeWidth={1.8} />For You</Link><Link to="/chat" className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] leading-4 ${pathname === "/chat" ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><Sparkles className="size-[17px]" strokeWidth={1.8} />Conversation</Link><Link to="/explore" className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] leading-4 ${pathname.startsWith("/explore") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><Compass className="size-[17px]" strokeWidth={1.8} />Explore</Link><Link to="/activity" className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] leading-4 ${pathname.startsWith("/activity") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><Bell className="size-[17px]" strokeWidth={1.8} />Activity</Link><button type="button" onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen} className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] leading-4 ${moreOpen ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}><MoreHorizontal className="size-[17px]" strokeWidth={1.8} />More</button></nav></div>{moreOpen ? <><button type="button" aria-label="Close more navigation" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-[49] bg-foreground/10 backdrop-blur-[1px] md:hidden" /><div className="fixed inset-x-3 bottom-[68px] z-[51] max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)] md:hidden"><nav aria-label="More navigation" className="grid grid-cols-2 gap-1">{authenticatedMoreItems.map(([to,label]) => <Link key={to} to={to} onClick={() => setMoreOpen(false)} className="rounded-xl px-3 py-2.5 text-[12.5px] leading-5 text-muted-foreground hover:bg-elevated hover:text-foreground">{label}</Link>)}</nav></div></> : null}</>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Kurukoo" },
      { name: "description", content: "Tell Kurukoo what you need and it gets it done." },
      { property: "og:title", content: "Kurukoo" },
      { property: "og:description", content: "A conversation-first assistant that gets things done." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});

function RootShell({ children }: { children: ReactNode }) { return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [authenticated, setAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => setAuthenticated(window.localStorage.getItem("kurukoo-authenticated") === "true");
    read();
    setHydrated(true);
    window.addEventListener("storage", read);
    window.addEventListener("kurukoo-auth-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("kurukoo-auth-updated", read);
    };
  }, []);

  const isPublicSurface = publicSurfacePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAnonymousHome = pathname === "/" && !authenticated;
  const usePublicShell = !authenticated && (isPublicSurface || isAnonymousHome);
  const savePublicPrompt = (prompt: string) => window.localStorage.setItem("kurukoo-chat-draft", prompt);

  return <QueryClientProvider client={queryClient}><KurukooProvider>{!hydrated ? <PublicKurukooShell><div className="min-h-[60vh] w-full" aria-label="Loading Kurukoo" /></PublicKurukooShell> : usePublicShell ? <PublicKurukooShell>{isAnonymousHome ? <PublicHome onSend={savePublicPrompt} /> : <Outlet />}</PublicKurukooShell> : <><AppShell><Outlet /></AppShell><AuthenticatedMobileBar /></>}</KurukooProvider></QueryClientProvider>;
}
