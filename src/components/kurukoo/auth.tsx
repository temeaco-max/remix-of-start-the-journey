import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Panel } from "@/components/kurukoo/ui";

export type AuthMode = "login" | "signup";
type AuthMethod = "options" | "phone" | "qr";

function SocialMark({ label }: { label: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background text-[14px] font-semibold">
      {label}
    </span>
  );
}

function QrCode() {
  const rows = [
    "1111111001011111111",
    "1000001010011000001",
    "1011101001111011101",
    "1011101010101011101",
    "1011101000101011101",
    "1000001011101000001",
    "1111111010101111111",
    "0000000001010000000",
    "1101011110111011011",
    "0011100101010010110",
    "1010111110101110101",
    "0111010001110001110",
    "1100101110011110011",
    "0000000010101000000",
    "1111111001111010111",
    "1000001010010010100",
    "1011101011111110111",
    "1011101001000010101",
    "1011101010111010111",
    "1000001001101000001",
    "1111111011011111111",
  ];
  return (
    <div
      className="mx-auto grid size-44 grid-cols-[repeat(21,minmax(0,1fr))] overflow-hidden rounded-lg border border-border bg-white p-2 shadow-sm"
      aria-label="Kurukoo QR sign-in code"
      role="img"
    >
      {rows
        .join("")
        .split("")
        .map((cell, index) => (
          <span key={index} className={cell === "1" ? "bg-black" : "bg-white"} />
        ))}
    </div>
  );
}

export function AuthModal({
  mode,
  onClose,
  onModeChange,
}: {
  mode: AuthMode;
  onClose: () => void;
  onModeChange?: (mode: AuthMode) => void;
}) {
  const [method, setMethod] = useState<AuthMethod>("options");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMethod("options");
    setSubmitted(false);
  }, [mode]);

  const title = mode === "login" ? "Log in to Kurukoo" : "Join Kurukoo";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kurukoo-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[min(760px,calc(100vh-32px))] w-full max-w-[420px] overflow-y-auto rounded-[24px] bg-background shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <X className="size-[18px]" />
        </button>
        <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="text-center">
            <span
              aria-hidden
              className="mx-auto grid size-10 place-items-center rounded-xl bg-brand-tint text-[17px] font-semibold text-brand-ink"
            >
              K
            </span>
            <h2 id="kurukoo-auth-title" className="mt-4 text-[21px] font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              {mode === "login"
                ? "Continue with the method you prefer."
                : "Create your account and start getting useful things moving."}
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => setMethod("qr")}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left text-[13px] font-medium transition-colors ${method === "qr" ? "border-foreground/30 bg-elevated" : "border-border hover:bg-elevated"}`}
            >
              <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-[11px] font-semibold">
                QR
              </span>
              <span className="flex-1">Use QR code</span>
              <span className="text-muted-foreground">›</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left text-[13px] font-medium transition-colors ${method === "phone" ? "border-foreground/30 bg-elevated" : "border-border hover:bg-elevated"}`}
            >
              <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-[13px]">
                @
              </span>
              <span className="flex-1">Use phone or email</span>
              <span className="text-muted-foreground">›</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3.5 text-left text-[13px] font-medium hover:bg-elevated"
            >
              <SocialMark label="f" />
              <span className="flex-1">Continue with Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3.5 text-left text-[13px] font-medium hover:bg-elevated"
            >
              <SocialMark label="G" />
              <span className="flex-1">Continue with Google</span>
            </button>
          </div>

          {method === "qr" ? (
            <div className="mt-5 rounded-2xl border border-border bg-surface p-5 text-center">
              <QrCode />
              <p className="mt-4 text-[13px] font-medium">Scan with your phone</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Open your camera, scan the code and confirm on your mobile device.
              </p>
              <button
                type="button"
                onClick={() => setMethod("options")}
                className="mt-4 text-[11px] font-medium underline underline-offset-2"
              >
                Use another method
              </button>
            </div>
          ) : null}

          {method === "phone" ? (
            <form
              className="mt-5 rounded-2xl border border-border bg-surface p-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label
                htmlFor="auth-phone-email"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Phone or email
              </label>
              <input
                id="auth-phone-email"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Enter phone or email"
                required
                className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                className="mt-3 min-h-11 w-full rounded-xl bg-foreground text-[13px] font-medium text-background hover:opacity-90"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setMethod("options")}
                className="mt-3 w-full text-[11px] font-medium text-muted-foreground"
              >
                Back to sign-in options
              </button>
            </form>
          ) : null}

          {submitted ? (
            <p className="mt-4 rounded-xl bg-elevated px-3.5 py-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
              Continue to complete your Kurukoo account access.
            </p>
          ) : null}

          <p className="mt-5 text-center text-[10.5px] leading-relaxed text-muted-foreground">
            By continuing, you agree to Kurukoo’s terms and privacy policy.
          </p>
          <div className="mt-5 border-t border-border pt-5 text-center text-[12px] text-muted-foreground">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => onModeChange?.("signup")}
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => onModeChange?.("login")}
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function establishPreviewSession() {
  localStorage.setItem("kurukoo-authenticated", "true");
  window.dispatchEvent(new Event("kurukoo-auth-updated"));
  window.location.assign("/");
}
export function AuthPanel({
  title,
  subtitle,
  cta,
  footer,
  showName = false,
}: {
  title: string;
  subtitle: string;
  cta: string;
  footer: ReactNode;
  showName?: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
      <Panel className="mt-6 p-5">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            establishPreviewSession();
          }}
        >
          {showName ? <Field label="Your name" type="text" autoComplete="name" /> : null}
          <Field label="Email" type="email" autoComplete="email" />
          <Field label="Password" type="password" autoComplete="current-password" />
          <button
            type="submit"
            className="min-h-11 w-full rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {cta}
          </button>
        </form>
        {submitted ? (
          <p
            role="status"
            className="mt-4 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13.5px] text-muted-foreground"
          >
            Accounts aren't switched on yet, so nothing was saved. You can still{" "}
            <Link to="/chat" className="underline">
              open Kurukoo
            </Link>{" "}
            and try it out.
          </p>
        ) : null}
      </Panel>
      <p className="mt-4 text-[13.5px] text-muted-foreground">{footer}</p>
      <p className="mt-2 text-[13.5px] text-muted-foreground">
        Or{" "}
        <Link to="/chat" className="underline">
          try Kurukoo without an account
        </Link>
        .
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  autoComplete,
}: {
  label: string;
  type: string;
  autoComplete: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-[13.5px] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
