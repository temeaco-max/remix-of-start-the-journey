import { Bookmark, Check, Loader2, Search, Share2, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 pb-3">
      <div>
        <h2 className="text-[17px] font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface", className)}>{children}</div>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {children}
    </ul>
  );
}

export function SearchField({
  placeholder,
  value,
  onChange,
  label,
}: {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <label htmlFor="k-search" className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="k-search"
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

export function Chips({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {items.map((item) => {
        const active = item === value;
        return (
          <button
            key={item}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-elevated hover:text-foreground",
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active = item === value;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item)}
            className={cn(
              "min-h-11 shrink-0 border-b-2 px-3 text-[14px] transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function FollowButton({ label = "Follow", small }: { label?: string; small?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn(!on)}
      className={cn(
        "shrink-0 rounded-full border px-3.5 transition-colors",
        small ? "min-h-8 text-[12.5px]" : "min-h-9 text-[13.5px]",
        on
          ? "border-transparent bg-elevated text-muted-foreground"
          : "border-border hover:bg-elevated",
      )}
    >
      {on ? `${label}ing` : label}
    </button>
  );
}

export function SaveButton() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Saved" : "Save"}
      onClick={() => setOn(!on)}
      className={cn(
        "grid size-9 place-items-center rounded-full transition-colors hover:bg-elevated",
        on ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Bookmark className="size-[17px]" fill={on ? "currentColor" : "none"} />
    </button>
  );
}

export function ShareButton() {
  return (
    <button
      type="button"
      aria-label="Share"
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated"
    >
      <Share2 className="size-[17px]" />
    </button>
  );
}

export function AdSlot({
  placement,
  headline,
  body,
  advertiser,
}: {
  placement: string;
  headline: string;
  body: string;
  advertiser: string;
}) {
  return (
    <aside
      aria-label={`Sponsored placement: ${placement}`}
      className="rounded-xl border border-dashed border-border bg-elevated/60 p-4"
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        Sponsored · {placement}
      </p>
      <p className="mt-1.5 text-[15px] font-medium">{headline}</p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{body}</p>
      <p className="mt-2 text-[12.5px] text-muted-foreground">{advertiser}</p>
    </aside>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3.5">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] font-semibold">{value}</p>
      {note ? <p className="mt-0.5 text-[12.5px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control?: ReactNode;
}) {
  return (
    <li className="flex min-h-11 items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px]">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {control}
    </li>
  );
}

export function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(Boolean(defaultOn));
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-elevated border border-border",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-surface shadow-[var(--shadow-soft)] transition-all",
          on ? "left-[19px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <span className="sr-only">Loading</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl border border-border bg-elevated/50" />
      ))}
    </div>
  );
}

export function InlineSpinner() {
  return <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />;
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-[15px] font-medium">
        <TriangleAlert className="size-4 text-destructive" />
        {title}
      </p>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{body}</p>
    </div>
  );
}

export function Badge({ children, tone = "quiet" }: { children: ReactNode; tone?: "quiet" | "accent" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]",
        tone === "accent"
          ? "bg-accent text-accent-foreground"
          : tone === "success"
            ? "bg-accent text-accent-foreground"
            : "bg-elevated text-muted-foreground",
      )}
    >
      {tone === "success" ? <Check className="size-3" strokeWidth={3} /> : null}
      {children}
    </span>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-elevated text-[13px] font-medium"
    >
      {name.slice(0, 1)}
    </span>
  );
}
