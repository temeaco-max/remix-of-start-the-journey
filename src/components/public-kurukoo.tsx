import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PublicRail } from "@/components/public-kurukoo-rail";
import { PublicContextRail } from "@/components/public-kurukoo-context";
import { PublicMobileNavigation } from "@/components/public-kurukoo-mobile-nav";
export { PublicHome } from "@/components/public-kurukoo-home";

const nav = [["/explore", "Explore"], ["/how-it-works", "How it works"], ["/capabilities", "Capabilities"], ["/topics", "Topics"]] as const;
const footer = [["/about", "About"], ["/blog", "Blog"], ["/help", "Help"], ["/legal", "Legal"]] as const;

export function PublicKurukooShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><PublicRail /><PublicMobileNavigation /><div className="flex min-h-screen pl-0 md:pl-[200px]"><main className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur"><div className="relative mx-auto flex h-12 w-full items-center justify-center px-5 lg:px-7"><Link to="/" className="absolute left-5 flex items-center gap-2 font-semibold tracking-[-0.025em] md:hidden"><img src="/favicon.ico" alt="Kurukoo" className="size-6 rounded-md" />Kurukoo</Link><nav aria-label="Kurukoo" className="hidden items-center justify-center gap-7 text-[12.5px] text-muted-foreground md:flex">{nav.map(([to, label]) => <Link key={to} to={to as never} activeProps={{ className: "text-foreground" }} className="transition-colors hover:text-foreground">{label}</Link>)}</nav><div className="absolute right-5 flex items-center gap-2"><Link to="/login" className="rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">Sign in</Link><Link to="/signup" className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">Get started</Link></div></div></header><div className="flex min-h-[calc(100vh-49px)] items-stretch"><div className="min-w-0 flex-1">{children}<footer className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-7 text-[11px] text-muted-foreground md:px-8"><p>Kurukoo · conversation-first coordination</p><nav aria-label="Information"><div className="flex flex-wrap gap-x-4 gap-y-2">{footer.map(([to, label]) => <Link key={to} to={to as never} className="hover:text-foreground">{label}</Link>)}</div></nav></footer></div><div className="hidden w-px bg-border/45 lg:block" aria-hidden /><PublicContextRail /></div></main></div></div>;
}
