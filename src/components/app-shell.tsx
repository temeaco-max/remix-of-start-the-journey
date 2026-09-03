import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, ListChecks, Bell, Users, Brain, Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/work", label: "Work", icon: ListChecks },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/memory", label: "Memory", icon: Brain },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kurukoo-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <button
      type="button"
      aria-label={dark ? "Use light appearance" : "Use dark appearance"}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kurukoo-theme", next ? "dark" : "light");
      }}
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-border bg-surface/60 px-3 py-5 md:flex">
        <div className="flex items-center justify-between px-3 pb-6">
          <span className="text-[15px] font-semibold tracking-tight">Kurukoo</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors",
                  active
                    ? "bg-elevated font-medium text-foreground"
                    : "text-muted-foreground hover:bg-elevated/70 hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <span className="text-[15px] font-semibold tracking-tight">Kurukoo</span>
        <ThemeToggle />
      </header>

      <main className="md:pl-[236px]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-[19px]" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="pb-6 pt-2">
      <h1 className="text-[26px] font-semibold md:text-[30px]">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted-foreground">{body}</p>
    </div>
  );
}
