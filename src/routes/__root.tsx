import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Bell, Compass, Home, MapPin, MoreHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/app-shell-contextual";
import { PublicHome, PublicKurukooShell } from "../components/public-kurukoo";
import { KurukooProvider } from "@/lib/kurukoo-store";
const publicPrefixes = [
  "/about",
  "/blog",
  "/capabilities",
  "/contributors",
  "/contact",
  "/explore",
  "/discover",
  "/help",
  "/how-it-works",
  "/legal",
  "/cookies",
  "/login",
  "/partners",
  "/people",
  "/pricing",
  "/providers",
  "/businesses",
  "/creators",
  "/advertising",
  "/signup",
  "/topics",
  "/use-cases",
  "/opportunities",
  "/safety",
] as const;
const authenticatedSurfacePrefixes = [
  "/chat",
  "/desk",
  "/activity",
  "/work",
  "/notifications",
  "/contacts",
  "/messages",
  "/memory",
  "/connect",
  "/artifacts",
  "/agents",
  "/calls",
  "/subscriptions",
  "/wallet",
  "/settings",
  "/you",
] as const;
const moreItems = [
  ["/work", "Work"],
  ["/topics", "Topics"],
  ["/capabilities", "Capabilities"],
  ["/providers", "Providers"],
  ["/businesses", "Businesses"],
  ["/creators", "Creators"],
  ["/advertising", "Advertising"],
  ["/pricing", "Plans"],
  ["/subscriptions", "Subscriptions"],
  ["/wallet", "Wallet"],
  ["/memory", "Memory"],
  ["/messages", "Messages"],
  ["/contacts", "Contacts"],
  ["/connect", "Connect"],
  ["/safety", "Safety"],
  ["/settings", "Settings"],
  ["/legal", "Legal & policies"],
] as const;
function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold">404</p>
        <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page does not exist or has moved.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to For You
        </Link>
      </div>
    </div>
  );
}
function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "root" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or return to For You.</p>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
function MobileBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/98 backdrop-blur md:hidden">
        <nav className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
          <Link
            to="/"
            className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] ${pathname === "/" ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <Home className="size-[17px]" />
            For You
          </Link>
          <Link
            to="/chat"
            className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] ${pathname.startsWith("/chat") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <Sparkles className="size-[17px]" />
            Conversation
          </Link>
          <Link
            to="/explore"
            className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] ${pathname.startsWith("/explore") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <Compass className="size-[17px]" />
            Explore
          </Link>
          <Link
            to="/discover"
            className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] ${pathname.startsWith("/discover") ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <MapPin className="size-[17px]" />
            Nearby
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`grid place-items-center rounded-xl px-1 py-1.5 text-[10px] ${moreOpen ? "bg-elevated font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <MoreHorizontal className="size-[17px]" />
            More
          </button>
        </nav>
      </div>
      {moreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close more navigation"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-[49] bg-foreground/10 md:hidden"
          />
          <div className="fixed inset-x-3 bottom-[68px] z-[51] max-h-[60vh] overflow-y-auto scrollbar-none rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)] md:hidden">
            <nav className="grid grid-cols-2 gap-1">
              {moreItems.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[12.5px] text-muted-foreground hover:bg-elevated"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Everyday AI OS for real life - Kurukoo" },
      { name: "description", content: "Tell Kurukoo what you need and it gets it done." },
      { property: "og:title", content: "Everyday AI OS for real life - Kurukoo" },
      {
        property: "og:description",
        content: "A conversation-first assistant that gets things done.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: ({ children }: { children: ReactNode }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  ),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
});
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [authenticated, setAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const read = () =>
      setAuthenticated(window.localStorage.getItem("kurukoo-authenticated") === "true");
    read();
    setHydrated(true);
    window.addEventListener("storage", read);
    window.addEventListener("kurukoo-auth-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("kurukoo-auth-updated", read);
    };
  }, []);
  const isPublic = publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthenticatedSurface = authenticatedSurfacePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const anonymousHome = pathname === "/" && !authenticated;
  const savePrompt = (prompt: string) => window.localStorage.setItem("kurukoo-chat-draft", prompt);
  return (
    <QueryClientProvider client={queryClient}>
      <KurukooProvider>
        {!hydrated ? (
          <PublicKurukooShell>
            <div className="min-h-[60vh]" />
          </PublicKurukooShell>
        ) : !authenticated && isPublic && !isAuthenticatedSurface && !anonymousHome ? (
          <PublicKurukooShell>
            {anonymousHome ? <PublicHome onSend={savePrompt} /> : <Outlet />}
          </PublicKurukooShell>
        ) : (
          <>
            <AppShell>
              <Outlet />
            </AppShell>
            <MobileBar />
          </>
        )}
      </KurukooProvider>
    </QueryClientProvider>
  );
}
