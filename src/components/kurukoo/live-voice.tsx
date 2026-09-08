import { AudioLines, Mic2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type LiveVoiceProps = {
  triggerIcon?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
};

export function LiveVoice({
  triggerIcon = <Mic2 className="size-[17px] text-muted-foreground" />,
  triggerLabel = "Talk to Kurukoo",
  triggerClassName = "grid size-9 place-items-center rounded-full hover:bg-elevated",
}: LiveVoiceProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <span className="relative inline-flex">
        <button
          type="button"
          aria-label={triggerLabel}
          title={triggerLabel}
          onClick={() => setOpen(true)}
          className={triggerClassName}
        >
          {triggerIcon}
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[10.5px] font-medium text-foreground opacity-0 shadow-[var(--shadow-soft)] transition-opacity duration-150 group-hover:opacity-100"
        >
          Use voice mode
        </span>
      </span>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice mode"
          className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-background"
        >
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5 md:px-8">
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Kurukoo" className="size-7 rounded-lg" />
              <div>
                <p className="text-[13px] font-semibold">Kurukoo</p>
                <p className="text-[10px] text-muted-foreground">Voice mode</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close voice mode"
              className="grid size-9 place-items-center rounded-full hover:bg-elevated"
            >
              <X className="size-[18px]" />
            </button>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div
              className={`relative grid size-36 place-items-center rounded-full bg-brand-tint text-brand-ink transition-all duration-500 ${active ? "scale-110 shadow-[0_0_0_18px_rgba(244,230,220,0.55)]" : ""}`}
            >
              <div
                className={`grid size-24 place-items-center rounded-full bg-background/80 ${active ? "animate-pulse" : ""}`}
              >
                <AudioLines className="size-9" strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-8 text-[24px] font-semibold tracking-tight">
              {active ? "I'm listening" : "Voice mode"}
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              Talk naturally to Kurukoo. Use the microphone in the composer when you want to dictate
              text instead.
            </p>
            <button
              type="button"
              onClick={() => setActive((value) => !value)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[12px] font-medium text-background"
            >
              <Mic2 className="size-4" />
              {active ? "Stop listening" : "Start talking"}
            </button>
          </div>
          <footer className="pb-7 text-center text-[10px] text-muted-foreground">
            Voice mode stays separate from composer dictation.
          </footer>
        </div>
      ) : null}
    </>
  );
}
