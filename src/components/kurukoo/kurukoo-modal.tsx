import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Reusable modal following the established codebase pattern:
 * createPortal → document.body, backdrop click-dismiss,
 * role="dialog" + aria-modal="true".
 *
 * Usage:
 *   <KurukooModal open={show} title="Confirm" onClose={() => setShow(false)}>
 *     <p>Are you sure?</p>
 *   </KurukooModal>
 */
export function KurukooModal({
  open,
  title,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  }[size];

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative my-auto w-full overflow-y-auto rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]",
          maxWidthClass,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-border bg-surface/95 text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="p-6 pr-14 md:p-7 md:pr-14">
          {title ? (
            <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.025em]">{title}</h2>
          ) : null}
          <div className={title ? "mt-4" : ""}>{children}</div>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
