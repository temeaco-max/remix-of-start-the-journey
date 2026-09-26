import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CircleDollarSign,
  Loader2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action } from "@/components/kurukoo/primitives";
import { Panel } from "@/components/kurukoo/ui";
import {
  createMoneyCircleApi,
  fetchContacts,
  isKurukooApiConfigured,
  type CanonicalContact,
} from "@/lib/kurukoo-api";

type Step = "start" | "details" | "review" | "created";

/**
 * InviteMembers — pick canonical contacts and share a circle invite through
 * the user's own apps (native share sheet, clipboard fallback). Kurukoo never
 * messages contacts directly, so no delivery is ever claimed here.
 */
function InviteMembers({ circleName, contribution }: { circleName: string; contribution: string }) {
  const [contacts, setContacts] = useState<CanonicalContact[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [shared, setShared] = useState(false);
  const configured = isKurukooApiConfigured();
  useEffect(() => {
    if (!configured) return;
    let live = true;
    void fetchContacts()
      .then((items) => {
        if (live) setContacts(items);
      })
      .catch(() => {
        if (live) setContacts([]);
      });
    return () => {
      live = false;
    };
  }, [configured]);
  if (!configured) return null;
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  const inviteText = (names: string[]) =>
    `Join my Kurukoo savings circle “${circleName}” (${contribution} per cycle)${names.length ? ` with ${names.join(", ")}` : ""}. Open Kurukoo to accept — no money moves until the canonical payment boundary.`;
  const share = async () => {
    const names = selected
      .map((id) => {
        const hit = (contacts || []).find(
          (c) => (c.personPhone || c.phone || "") === id,
        );
        return hit?.displayName || hit?.name || hit?.label || id;
      })
      .slice(0, 10);
    const text = inviteText(names);
    try {
      const nav = window.navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ title: `Join ${circleName}`, text });
        setShared(true);
        return;
      }
      throw new Error("share unavailable");
    } catch {
      try {
        await window.navigator.clipboard?.writeText(text);
        setShared(true);
      } catch {}
    }
  };
  return (
    <div className="mt-6 rounded-2xl border border-border p-4">
      <p className="text-[15px] font-medium">Invite from contacts</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Pick people from your Kurukoo contacts and send the invite through your own apps.
        Kurukoo does not message them directly.
      </p>
      {contacts === null ? (
        <p className="mt-3 text-[12px] text-muted-foreground">Loading contacts…</p>
      ) : contacts.length ? (
        <div className="mt-3 grid gap-1.5">
          {contacts.slice(0, 20).map((c) => {
            const id = String(c.personPhone || c.phone || "");
            if (!id) return null;
            const label = c.displayName || c.name || c.label || id;
            const on = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={on}
                className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border px-3 text-left text-[13px] transition-colors hover:bg-elevated"
              >
                <span
                  aria-hidden
                  className={`grid size-4 place-items-center rounded-full border ${on ? "border-transparent bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {on ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">
          No contacts yet. Add people under Contacts first, then invite them here.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Action variant="primary" onClick={() => void share()}>
          Share invite{selected.length ? ` (${selected.length})` : ""}
        </Action>
        {shared ? (
          <span className="text-[11.5px] text-muted-foreground">
            Invite prepared — sent through your apps, not by Kurukoo.
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * MoneyCircleStepper — the specialised Explore flow for savings circles.
 *
 * "Create" calls the canonical /api/circle/create boundary and shows the
 * truthful result. Circle creation registers the group; contributions and
 * payouts stay gated by the canonical payment boundary, so no success state
 * here implies that money moved.
 */
export function MoneyCircleStepper() {
  const [step, setStep] = useState<Step>("start");
  const [name, setName] = useState("My savings circle");
  const [amount, setAmount] = useState("20000");
  const [frequency, setFrequency] = useState("Monthly");
  const [members, setMembers] = useState("5");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCircleId, setCreatedCircleId] = useState<number | null>(null);
  const configured = isKurukooApiConfigured();

  const total = useMemo(() => {
    const value = Number(amount.replace(/[^0-9]/g, "")) || 0;
    const count = Number(members) || 0;
    return value * count;
  }, [amount, members]);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createMoneyCircleApi(
        name.trim(),
        total > 0 ? total : Number(amount) || 0,
      );
      if (!result.success || !result.circleId) {
        setCreateError(result.message || "The circle could not be created.");
        return;
      }
      setCreatedCircleId(result.circleId);
      setStep("created");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "The circle could not be created.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Money Circle"
        subtitle="Start or manage a savings circle without losing track of who contributes what."
      />

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Link to="/explore" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Explore
        </Link>
        <span>/</span>
        <span>Money &amp; work</span>
        <span>/</span>
        <span className="text-foreground">Money Circle</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Panel className="p-5 md:p-6">
          {step === "start" ? (
            <>
              <div className="grid size-11 place-items-center rounded-2xl bg-brand-tint text-brand-ink">
                <CircleDollarSign className="size-5" />
              </div>
              <h2 className="mt-4 text-[22px] font-semibold tracking-tight">
                What do you want to do?
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="rounded-2xl border border-border p-4 text-left hover:bg-elevated"
                >
                  <p className="text-[14px] font-semibold">Start a circle</p>
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                    Set the contribution, members and schedule.
                  </p>
                </button>
                <Link
                  to="/chat"
                  search={{ query: "Help me manage my Money Circle" } as never}
                  className="rounded-2xl border border-border p-4 text-left hover:bg-elevated"
                >
                  <p className="text-[14px] font-semibold">Manage a circle</p>
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                    Ask Kurukoo about an existing circle.
                  </p>
                </Link>
              </div>
            </>
          ) : step === "details" ? (
            <>
              <h2 className="text-[22px] font-semibold tracking-tight">Set up your circle</h2>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium">Circle name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium">Contribution per member</span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
                  />
                </label>
                <div className="grid gap-1.5">
                  <span className="text-[11px] font-medium">Frequency</span>
                  <div className="flex gap-2">
                    {["Weekly", "Monthly"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFrequency(option)}
                        className={
                          frequency === option
                            ? "rounded-xl bg-primary px-3 py-2 text-[11px] text-primary-foreground"
                            : "rounded-xl border border-border px-3 py-2 text-[11px]"
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-medium">Number of members</span>
                  <input
                    inputMode="numeric"
                    value={members}
                    onChange={(e) => setMembers(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-5 flex gap-2">
                <Action onClick={() => setStep("start")}>Back</Action>
                <Action variant="primary" onClick={() => setStep("review")}>
                  Review circle <ArrowRight className="size-3.5" />
                </Action>
              </div>
            </>
          ) : step === "review" ? (
            <>
              <h2 className="text-[22px] font-semibold tracking-tight">Review your circle</h2>
              <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
                <Row label="Name" value={name} />
                <Row
                  label="Contribution"
                  value={`₦${Number(amount || 0).toLocaleString()} / ${frequency.toLowerCase().replace("monthly", "month").replace("weekly", "week")}`}
                />
                <Row label="Members" value={members} />
                <Row label="Cycle total" value={`₦${total.toLocaleString()}`} />
              </div>
              <div className="mt-4 rounded-2xl bg-elevated/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
                Creating the circle registers it with the canonical circle boundary. Contributions
                are recorded as intentions only — funds move exclusively through the canonical
                payment boundary when live settlement evidence exists.
              </div>
              <div className="mt-5 flex gap-2">
                <Action onClick={() => setStep("details")}>Edit</Action>
                <Action
                  variant="primary"
                  onClick={() => {
                    void handleCreate();
                  }}
                  disabled={creating || !configured}
                >
                  {creating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                  {creating ? "Creating…" : "Create circle"}
                </Action>
              </div>
              {createError ? (
                <p className="mt-3 text-[11.5px] text-destructive" role="alert">
                  {createError}
                </p>
              ) : null}
              {!configured ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  The live backend is not configured in this session. Circle creation requires the
                  canonical API.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid size-12 place-items-center rounded-full bg-brand-tint text-brand-ink">
                <Check className="size-5" />
              </div>
              <h2 className="mt-4 text-[22px] font-semibold tracking-tight">Circle registered</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {createdCircleId
                  ? `Circle #${createdCircleId} “${name}” is registered with the canonical circle boundary.`
                  : `Circle “${name}” is registered with the canonical circle boundary.`}{" "}
                No money has moved. Contributions are intentions until settlement through the
                canonical payment boundary.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/chat"
                  search={
                    {
                      query: `I just created a Money Circle called ${name} (circle ${createdCircleId ?? ""}). Help me add members and set up the contribution order.`,
                    } as never
                  }
                >
                  <Action variant="primary">Continue in Chat</Action>
                </Link>
                <Action onClick={() => setStep("start")}>Start another</Action>
              </div>
              <InviteMembers
                circleName={name}
                contribution={`₦${Number(amount || 0).toLocaleString()} / ${frequency.toLowerCase().replace("monthly", "month").replace("weekly", "week")}`}
              />
            </>
          )}
        </Panel>

        <aside className="rounded-[22px] border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-semibold">Your circle at a glance</span>
          </div>
          <div className="mt-5 space-y-4">
            <Row label="Contribution" value={`₦${Number(amount || 0).toLocaleString()}`} />
            <Row label="Schedule" value={frequency} />
            <Row label="Members" value={members} />
            <Row label="Cycle" value={`₦${total.toLocaleString()}`} />
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <Users className="size-3.5" /> What comes next
            </div>
            <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
              <p>1. Confirm the circle details.</p>
              <p>2. Invite or identify members.</p>
              <p>3. Establish the contribution order.</p>
              <p>4. Authorise payments when the live boundary is enabled.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-right text-[12px] font-medium">{value}</span>
    </div>
  );
}
