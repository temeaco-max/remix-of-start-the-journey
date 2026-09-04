import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const primary = [
  { to: "/about", label: "How it works" },
  { to: "/use-cases", label: "Use cases" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
] as const;

const footerGroups = [
  {
    title: "Product",
    links: [
      { to: "/about", label: "How it works" },
      { to: "/use-cases", label: "Use cases" },
      { to: "/pricing", label: "Pricing" },
      { to: "/chat", label: "Open Kurukoo" },
    ],
  },
  {
    title: "For",
    links: [
      { to: "/providers", label: "Providers" },
      { to: "/businesses", label: "Businesses" },
      { to: "/creators", label: "Creators" },
      { to: "/agents", label: "Agent network" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/blog", label: "Blog" },
      { to: "/partners", label: "Partners" },
      { to: "/contributors", label: "Contributors" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/help", label: "Help centre" },
      { to: "/login", label: "Log in" },
      { to: "/signup", label: "Get started" },
    ],
  },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="text-[16px] font-semibold tracking-tight">
          Kurukoo
        </Link>
        <nav aria-label="Kurukoo" className="hidden flex-1 gap-1 md:flex">
          {primary.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground" }}
              className="rounded-full px-3 py-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            className="hidden min-h-9 items-center rounded-full px-3.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
      <nav
        aria-label="Kurukoo pages"
        className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
      >
        {primary.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeProps={{ className: "border-transparent bg-elevated text-foreground" }}
            className="min-h-8 shrink-0 rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/40">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <ul className="mt-3 space-y-2">
              {group.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-[14px] text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 text-[13px] text-muted-foreground md:px-8">
        Kurukoo — AI that gets things done. This is a prototype build: nothing is booked, paid for
        or sent to a real business yet.
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">{children}</main>
      <PublicFooter />
    </div>
  );
}

/** Content wrapper kept for pages written before the public shell existed. */
export function MarketingPage({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
