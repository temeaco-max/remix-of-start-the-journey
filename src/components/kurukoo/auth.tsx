import { ArrowLeft, Mail, Phone, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { requestMagicLink, requestPhoneOtp, verifyPhoneOtp } from "@/lib/kurukoo-auth";

export type AuthMode = "login" | "signup";
type Method = "phone" | "email";

type AuthFlowProps = { mode: AuthMode; compact?: boolean; onClose?: () => void };

function AuthFlow({ mode, compact = false, onClose }: AuthFlowProps) {
  const [method, setMethod] = useState<Method>("phone");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"identifier" | "code" | "sent">("identifier");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMethod("phone"); setStep("identifier"); setIdentifier(""); setCode(""); setMessage(null);
  }, [mode]);

  async function sendCode() {
    if (!identifier.trim()) return setMessage(method === "phone" ? "Enter your phone number." : "Enter your email address.");
    setBusy(true); setMessage(null);
    try {
      if (method === "phone") {
        await requestPhoneOtp(identifier);
        setStep("code"); setMessage("Verification code sent. Check your phone and enter it here.");
      } else {
        await requestMagicLink({ email: identifier, name: name || undefined, returnPath: "/" });
        setStep("sent"); setMessage("Sign-in link sent. Open it to finish securely.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not start sign-in."); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!code.trim()) return setMessage("Enter the verification code.");
    setBusy(true); setMessage(null);
    try {
      await verifyPhoneOtp({ phone: identifier, code, name: name || undefined });
      window.localStorage.setItem("kurukoo-authenticated", "true");
      window.dispatchEvent(new Event("kurukoo-auth-updated"));
      window.location.assign("/");
    } catch (error) { setMessage(error instanceof Error ? error.message : "That verification code could not be accepted."); }
    finally { setBusy(false); }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kurukoo access</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em]">{mode === "login" ? "Welcome back" : "Join Kurukoo"}</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Use a real verification path so your account, work and connected resources stay tied to the same identity.</p>
        </div>
        {onClose ? <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-elevated"><X className="size-[18px]" /></button> : null}
      </div>
      {step === "identifier" ? <>
        {mode === "signup" ? <label className="block text-[11px] font-medium">Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label> : null}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-elevated/60 p-1">
          <button type="button" onClick={() => { setMethod("phone"); setMessage(null); }} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium ${method === "phone" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}><Phone className="size-3.5" /> Phone</button>
          <button type="button" onClick={() => { setMethod("email"); setMessage(null); }} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium ${method === "email" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}><Mail className="size-3.5" /> Email</button>
        </div>
        <label className="block text-[11px] font-medium">{method === "phone" ? "Phone number" : "Email address"}<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} type={method === "email" ? "email" : "tel"} autoComplete={method === "email" ? "email" : "tel"} placeholder={method === "phone" ? "+44 7700 900000" : "you@example.com"} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <button type="button" disabled={busy} onClick={() => void sendCode()} className="min-h-11 w-full rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground disabled:opacity-50">{busy ? "Working…" : method === "phone" ? "Send verification code" : "Send sign-in link"}</button>
      </> : null}
      {step === "code" ? <div className="space-y-3">
        <button type="button" onClick={() => { setStep("identifier"); setMessage(null); }} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Change number</button>
        <label className="block text-[11px] font-medium">Verification code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter the code" className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-center font-mono text-[18px] tracking-[0.18em] outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <button type="button" disabled={busy} onClick={() => void verify()} className="min-h-11 w-full rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground disabled:opacity-50">{busy ? "Verifying…" : "Verify and continue"}</button>
      </div> : null}
      {step === "sent" ? <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-[13px] font-medium">Check your email</p><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Open the secure Kurukoo sign-in link in your email. You can close this window and return when it is complete.</p><button type="button" onClick={() => { setStep("identifier"); setMessage(null); }} className="mt-3 text-[11px] font-medium underline underline-offset-2">Use another method</button></div> : null}
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
