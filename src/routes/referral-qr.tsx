import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { actionClass } from "@/components/kurukoo/primitives";
import { generateQrContext } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/referral-qr")({
  head: () => ({
    meta: [
      { title: "Share a Kurukoo context — Kurukoo" },
      {
        name: "description",
        content:
          "Generate a signed Kurukoo QR context that opens the same conversation with useful context.",
      },
    ],
    links: [{ rel: "canonical", href: "/referral-qr" }],
  }),
  component: ReferralQrPage,
});

const CONTEXTS = [
  { value: "referral", label: "Referral — invite someone to start with Kurukoo" },
  { value: "contributor", label: "Contributor — explore contributor opportunities" },
  { value: "network", label: "Network — introduce a network capability" },
  { value: "offer", label: "Offer — ask about a product or service" },
  { value: "channel", label: "Channel — begin a truthful connection flow" },
];

function ReferralQrPage() {
  const [context, setContext] = useState("referral");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    svg?: string;
    entryUrl?: string;
    description?: string;
  } | null>(null);

  async function generate() {
    setBusy(true);
    setMessage(null);
    setResult(null);
    try {
      const payload = await generateQrContext({
        type: context,
        ...(detail.trim() ? { entity: detail.trim().slice(0, 96) } : {}),
      });
      if (!payload.svg || !payload.entryUrl) {
        setMessage("Kurukoo did not return a usable QR context.");
        return;
      }
      setResult({
        svg: payload.svg,
        entryUrl: payload.entryUrl,
        description:
          typeof payload.description === "string" ? payload.description : undefined,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Kurukoo could not generate this QR context.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-8">
      <header className="max-w-2xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
          Contextual entry
        </p>
        <h1 className="mt-2 font-serif text-[36px] leading-[1.05] tracking-[-0.04em]">
          Share a Kurukoo context
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          QR codes open the same Kurukoo conversation with useful context. They do not
          authenticate someone, send payment, award Points, or activate a channel.
        </p>
      </header>
      <Panel>
        <label
          htmlFor="qr-context"
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          What should this QR introduce?
        </label>
        <select
          id="qr-context"
          value={context}
          onChange={(event) => setContext(event.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px]"
        >
          {CONTEXTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label
          htmlFor="qr-detail"
          className="mt-4 block text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Optional context
        </label>
        <input
          id="qr-detail"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          maxLength={96}
          placeholder="For example: phone repair"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px]"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy}
            className={actionClass("primary")}
          >
            <QrCode className="mr-1 size-4" />
            {busy ? "Generating…" : "Generate QR"}
          </button>
          <Link to="/chat" className={actionClass()}>
            Open chat
          </Link>
        </div>
        {message ? (
          <p role="status" className="mt-3 text-[13.5px] text-destructive">
            {message}
          </p>
        ) : null}
        {result?.svg ? (
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <div
              className="mx-auto w-fit rounded-xl border border-border bg-white p-3"
              role="img"
              aria-label="Kurukoo contextual QR code"
              dangerouslySetInnerHTML={{ __html: result.svg }}
            />
            {result.description ? (
              <p className="text-[13.5px] leading-6 text-muted-foreground">
                {result.description}
              </p>
            ) : null}
            {result.entryUrl ? (
              <a
                href={result.entryUrl}
                className="text-[13.5px] font-medium text-primary underline"
              >
                Open this context
              </a>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
