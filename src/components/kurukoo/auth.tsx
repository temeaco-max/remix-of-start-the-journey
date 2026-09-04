import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Panel } from "@/components/kurukoo/ui";

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
            Accounts aren't switched on in this prototype yet, so nothing was saved. You can still{" "}
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
