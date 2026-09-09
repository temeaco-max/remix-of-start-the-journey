import { Mail, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { KURUKOO_BUILD_EMAIL, requestMagicLink } from "@/lib/kurukoo-auth";

export type AuthMode = "login" | "signup";
type AuthFlowProps = { mode: AuthMode; compact?: boolean; onClose?: () => void };

function AuthFlow({ mode, compact = false, onClose }: AuthFlowProps) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(KURUKOO_BUILD_EMAIL);
  const [step, setStep] = useState<"identifier" | "sent">("identifier");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStep("identifier");
    setIdentifier(KURUKOO_BUILD_EMAIL);
    setMessage(null);
  }, [mode]);

  async function sendLink() {
    const email = identifier.trim().toLowerCase();
    if (!email) return setMessage("Enter your email address.");
    if (email !== KURUKOO_BUILD_EMAIL) return setMessage(`This build is currently available only to ${KURUKOO_BUILD_EMAIL}.`);
    setBusy(true);
    setMessage(null);
    try {
      await requestMagicLink({ email, name: name || undefined, returnPath: "/" });
      setStep("sent");
      setMessage("Sign-in link sent. Open it to finish securely.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not start sign-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kurukoo access</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em]">{mode === "login" ? "Welcome back" : "Join Kurukoo"}</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Sign in securely with the email account enabled for this build.</p>
        </div>
        {onClose ? <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><X className="size-[18px]" /></button> : null}
      </div>
      {step === "identifier" ? <>
        {mode === "signup" ? <label className="block text-[11px] font-medium">Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label> : null}
        <label className="block text-[11px] font-medium">Email address<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} type="email" autoComplete="email" placeholder={KURUKOO_BUILD_EMAIL} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <button type="button" disabled={busy} onClick={() => void sendLink()} className="min-h-11 w-full rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground disabled:opacity-50">{busy ? "Working…" : "Send sign-in link"}</button>
      </> : null}
      {step === "sent" ? <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-[13px] font-medium">Check your email</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Open the secure Kurukoo sign-in link in your email. You can close this window and return when it is complete.</p><button type="button" onClick={() => { setStep("identifier"); setMessage(null); }} className="mt-3 text-[11px] font-medium underline underline-offset-2">Use this email again</button></div> : null}
      {message ? <p role="status" className="rounded-xl bg-elevated px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">{message}</p> : null}
      <p className="text-[10.5px] leading-relaxed text-muted-foreground">By continuing, you agree to Kurukoo’s terms and privacy policy.</p>
    </div>
  );
}

export function AuthModal({ mode, onClose, onModeChange }: { mode: AuthMode; onClose: () => void; onModeChange?: (mode: AuthMode) => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[3px]" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="relative max-h-[min(760px,calc(100vh-32px))] w-full max-w-[430px] overflow-y-auto rounded-[24px] bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8"><AuthFlow mode={mode} onClose={onClose} /><div className="mt-5 border-t border-border pt-5 text-center text-[12px] text-muted-foreground">{mode === "login" ? <>New here? <button type="button" onClick={() => onModeChange?.("signup")} className="font-medium text-foreground underline underline-offset-2">Create an account</button></> : <>Already have an account? <button type="button" onClick={() => onModeChange?.("login")} className="font-medium text-foreground underline underline-offset-2">Log in</button></>}</div></div></div>;
}

export function AuthPanel({ title, subtitle, cta, footer, showName = false }: { title: string; subtitle: string; cta: string; footer: ReactNode; showName?: boolean }) {
  return <div className="mx-auto max-w-md py-6"><h1 className="font-serif text-[38px] leading-[1.02] tracking-[-0.045em]">{title}</h1><p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{subtitle}</p><Panel className="mt-6 p-5"><AuthFlow mode={showName ? "signup" : "login"} /></Panel><p className="mt-4 text-[13px] text-muted-foreground">{footer}</p><p className="mt-2 text-[11.5px] text-muted-foreground">Your authenticated session is held by Kurukoo’s secure server cookie, not by the browser UI.</p></div>;
}
