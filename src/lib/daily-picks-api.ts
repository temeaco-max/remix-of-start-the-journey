export type DailyPick = {
  title: string;
  description: string;
  price?: string | null;
  creditReward?: number | null;
};

const API_BASE = (import.meta.env["VITE_KURUKOO_API_BASE_URL"] ?? "").replace(/\/$/, "");

export async function fetchDailyPick(): Promise<DailyPick> {
  const response = await fetch(`${API_BASE}/api/daily-picks`, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.pick) {
    throw new Error(typeof payload?.error === "string" ? payload.error : `Daily Pick request failed (${response.status})`);
  }
  return payload.pick as DailyPick;
}
