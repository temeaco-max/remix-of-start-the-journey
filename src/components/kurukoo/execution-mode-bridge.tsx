import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Laptop, Layers3, UserRound } from "lucide-react";

type Mode = { id: "digital" | "physical" | "hybrid" | "assisted"; title: string; description: string; prompt: string };
type LocalAdapter = { country: string; name: string; status: "configured" | "pending_activation"; strengths: string[]; externalActivationRequired?: boolean };
type Overview = { success?: boolean; modes?: Mode[]; readiness?: { ready?: boolean }; localExecutionAdapter?: LocalAdapter };

const icons = { digital: Laptop, physical: UserRound, hybrid: Layers3, assisted: CircleDashed } as const;

export function ExecutionModeBridge() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [adapter, setAdapter] = useState<LocalAdapter | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/v1/execution/overview", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Execution overview unavailable");
        return response.json() as Promise<Overview>;
      })
      .then((data) => {
        if (!cancelled) {
          setModes(Array.isArray(data.modes) ? data.modes : []);
          setAdapter(data.localExecutionAdapter ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModes([]);
          setAdapter(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || !modes.length) return null;

  return <section className="rounded-2xl border border-border bg-surface p-4" aria-label="Execution modes">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[12.5px] font-semibold">Execution route</p><p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">Kurukoo keeps digital, physical, hybrid and user-assisted work on the same execution contract.</p></div><CheckCircle2 className="size-4 shrink-0 text-primary"/></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{modes.map((mode) => { const Icon = icons[mode.id]; return <div key={mode.id} className="rounded-xl bg-elevated/45 p-2.5"><div className="flex items-center gap-2"><Icon className="size-3.5 text-primary"/><p className="text-[11.5px] font-medium">{mode.title}</p></div><p className="mt-1 text-[9.5px] leading-4 text-muted-foreground">{mode.description}</p></div>; })}</div>
    {adapter ? <div className="mt-3 rounded-xl border border-border bg-elevated/35 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Local execution adapter</p><p className="mt-1 text-[12px] font-medium">{adapter.name}</p></div><span className="rounded-full bg-background px-2 py-1 text-[9.5px] font-medium">{adapter.status === "configured" ? "Configured" : "Pending activation"}</span></div><p className="mt-2 text-[10px] leading-4 text-muted-foreground">{adapter.strengths.join(" · ")}. External provider or device activation is still required before any live fulfilment claim.</p></div> : null}
  </section>;
}
