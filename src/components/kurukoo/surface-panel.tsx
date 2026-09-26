import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SurfacePanel — a slide-over panel that renders inline within the main
 * surface area (not a portal). Used when a page's secondary content should
 * appear within the current page rather than as a separate route.
 *
 * Usage:
 *   <SurfacePanel open={detailOpen} title="Request details" onOpenChange={setDetailOpen}>
 *     <RequestDetailView />
 *   </SurfacePanel>
 */
export function SurfacePanel({
  open,
  title,
  children,
  onOpenChange,
  className,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[90] bg-black/30 opacity-0 backdrop-blur-[2px] transition-opacity duration-200",
          open && "pointer-events-auto opacity-100",
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[95] flex h-[calc(100vh-50px)] w-full max-w-md translate-x-full flex-col border-l border-border bg-surface shadow-[var(--shadow-lift)] transition-transform duration-200 ease-out md:max-w-lg",
          open && "translate-x-0",
          className,
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close panel"
                className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <h2 className="text-[15px] font-semibold">{title}</h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close panel"
              className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
        </div>
      </div>
    </>
  );
}
