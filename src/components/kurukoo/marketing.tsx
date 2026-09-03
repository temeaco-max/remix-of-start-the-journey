import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const links = [
  { to: "/about", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/providers", label: "Providers" },
  { to: "/businesses", label: "Businesses" },
  { to: "/creators", label: "Creators" },
  { to: "/agents", label: "Agent network" },
  { to: "/blog", label: "Blog" },
] as const;

const footer = [
  { to: "/partners", label: "Partners" },
  { to: "/contributors", label: "Contributors" },
  { to: "/help", label: "Help" },
  { to: "/contact", label: "Contact" },
] as const;

export function MarketingNav() {
  return (
    <nav aria-label="Kurukoo product pages" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-6">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeProps={{ className: "border-transparent bg-primary text-primary-foreground" }}
          className="min-h-9 shrink-0 rounded-full border border-border px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-[13.5px] text-muted-foreground">
      <div className="flex flex-wrap gap-4">
        {footer.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </div>
      <p className="mt-4">Kurukoo — ask, and it gets done. Prototype build, no live services.</p>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNav />
      {children}
      <MarketingFooter />
    </>
  );
}
