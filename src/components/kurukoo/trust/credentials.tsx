import { LockKeyhole, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { actionClass } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import { encryptSecret } from "@/lib/crypto-client";
import { describeError } from "@/lib/trust-api";
import type { Credential, CredentialType, TrustResourceState } from "@/lib/trust-api";
import { LoadingRows, EmptyNote, AvailabilityNote, SectionHeading, credentialTypeLabel } from "./shared";

export function CredentialsSection({
  credentials,
  state,
  loading,
  busy,
  onCreate,
  onDelete,
}: {
  credentials: Credential[];
  state?: TrustResourceState | undefined;
  loading: boolean;
  busy: string | null;
  onCreate: (input: {
    label: string;
    domain?: string;
    credentialType: CredentialType;
    ciphertext: string;
    iv: string;
    salt: string;
  }) => Promise<boolean>;
  onDelete: (id: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [domain, setDomain] = useState("");
  const [credentialType, setCredentialType] = useState<CredentialType>("password");
  const [passphrase, setPassphrase] = useState("");
  const [secret, setSecret] = useState("");
  const [formError, setFormError] = useState("");

  async function submit() {
    setFormError("");
    if (!label.trim()) {
      setFormError("Give the credential a label so you recognise it later.");
      return;
    }
    if (!passphrase.trim()) {
      setFormError("A passphrase is required — Kurukoo never stores it.");
      return;
    }
    if (!secret.trim()) {
      setFormError("Enter the secret you want encrypted.");
      return;
    }
    try {
      const encrypted = await encryptSecret(secret, passphrase);
      const input: {
        label: string;
        domain?: string;
        credentialType: CredentialType;
        ciphertext: string;
        iv: string;
        salt: string;
      } = {
        label: label.trim(),
        credentialType,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
      };
      if (domain.trim()) input.domain = domain.trim();
      const stored = await onCreate(input);
      if (stored) {
        setLabel("");
        setDomain("");
        setPassphrase("");
        setSecret("");
        setCredentialType("password");
        setOpen(false);
      }
    } catch (cause) {
      setFormError(
        describeError(cause, "This secret could not be encrypted, so nothing was stored."),
      );
    }
  }

  return (
    <section id="credentials" className="scroll-mt-6">
      <SectionHeading
        eyebrow="Encrypted credentials"
        title="Secrets Kurukoo can use but never read"
        body="Your secret is encrypted in this browser with AES-256-GCM and PBKDF2 (200k iterations, SHA-512) before it is sent. Kurukoo stores ciphertext, salt and iv only — never your passphrase and never the plain text."
        action={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={actionClass("primary")}
          >
            <Plus className="size-3.5" /> {open ? "Close" : "Add credential"}
          </button>
        }
      />
      {open ? (
        <Panel className="mb-3 space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              aria-label="Credential label"
              placeholder="Label (e.g. Utility account)"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            />
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              aria-label="Credential domain"
              placeholder="Domain (optional)"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            />
            <select
              value={credentialType}
              onChange={(event) => setCredentialType(event.target.value as CredentialType)}
              aria-label="Credential type"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            >
              {Object.keys(credentialTypeLabel).map((type) => (
                <option key={type} value={type}>
                  {credentialTypeLabel[type]}
                </option>
              ))}
            </select>
            <input
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              aria-label="Encryption passphrase"
              placeholder="Encryption passphrase (never stored)"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              aria-label="Secret to encrypt"
              placeholder="Secret to encrypt"
              className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none sm:col-span-2"
            />
          </div>
          {formError ? (
            <p role="alert" className="text-[11.5px] text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === "credential:create"}
              onClick={() => void submit()}
              className={actionClass("primary")}
            >
              {busy === "credential:create" ? "Encrypting…" : "Encrypt & store"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setFormError("");
              }}
              className={actionClass()}
            >
              Cancel
            </button>
          </div>
        </Panel>
      ) : null}{" "}
      <Panel className="overflow-hidden p-0">
        {loading ? (
          <LoadingRows />
        ) : state && state.state !== "available" ? (
          <AvailabilityNote label="Encrypted credentials" state={state} />
        ) : credentials.length ? (
          <div className="divide-y divide-border">
            {credentials.map((credential) => (
              <div key={credential.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                <span className="grid size-9 shrink-0 place-items-center bg-elevated">
                  <LockKeyhole className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{credential.label}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    {[
                      credential.domain,
                      credential.credentialType
                        ? (credentialTypeLabel[credential.credentialType] ??
                          credential.credentialType)
                        : null,
                      credential.lastUsedAt
                        ? `last used ${new Date(credential.lastUsedAt).toLocaleDateString()}`
                        : "not used yet",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete credential ${credential.label}`}
                  disabled={busy === `${credential.id}:delete`}
                  onClick={() => onDelete(credential.id, credential.label)}
                  className="grid size-9 place-items-center text-muted-foreground hover:bg-elevated hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>
            No credentials are stored for this account yet. Add one and it will be encrypted before
            it leaves your browser.
          </EmptyNote>
        )}
      </Panel>
    </section>
  );
}
