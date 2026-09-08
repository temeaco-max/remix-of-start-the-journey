const API_BASE = (import.meta.env["VITE_KURUKOO_API_BASE_URL"] ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function readJson<T>(path: string, init?: RequestInit): Promise<{ response: Response; payload: T }> {
  const response = await fetch(apiUrl(path), { credentials: "include", ...init });
  const payload = (await response.json().catch(() => ({}))) as T;
  return { response, payload };
}

export type KurukooAuthUser = { phone?: string; role?: string; [key: string]: unknown };

export async function getKurukooAuthState(): Promise<{ authenticated: boolean; user: KurukooAuthUser | null }> {
  try {
    const { response, payload } = await readJson<{ success?: boolean; user?: KurukooAuthUser }>("/api/auth/me");
    if (!response.ok) return { authenticated: false, user: null };
    return { authenticated: Boolean(payload?.success), user: payload?.user ?? null };
  } catch {
    return { authenticated: false, user: null };
  }
}

export async function requestPhoneOtp(phone: string) {
  const { response, payload } = await readJson<{ success?: boolean; message?: string; error?: string; testMode?: boolean; devCode?: string }>("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  if (!response.ok || payload.success === false) throw new Error(payload.message || payload.error || "Unable to send the verification code.");
  return payload;
}

export async function verifyPhoneOtp(input: { phone: string; code: string; name?: string; email?: string }) {
  const { response, payload } = await readJson<{ success?: boolean; message?: string; error?: string; user?: KurukooAuthUser }>("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: input.phone.trim(), code: input.code.trim(), name: input.name?.trim() || undefined, email: input.email?.trim().toLowerCase() || undefined, deviceId: getDeviceId(), credentialType: "web" }),
  });
  if (!response.ok || payload.success !== true) throw new Error(payload.message || payload.error || "That verification code could not be accepted.");
  return payload;
}

export async function requestMagicLink(input: { email: string; name?: string; returnPath?: string }) {
  const { response, payload } = await readJson<{ success?: boolean; message?: string; error?: string; delivery?: string }>("/api/auth/request-magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: input.email.trim().toLowerCase(), name: input.name?.trim() || undefined, returnPath: input.returnPath || "/" }),
  });
  if (!response.ok || payload.success === false) throw new Error(payload.message || payload.error || "Unable to send a sign-in link.");
  return payload;
}

export async function logoutKurukoo() {
  try {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
  } finally {
    window.localStorage.removeItem("kurukoo-authenticated");
    window.dispatchEvent(new Event("kurukoo-auth-updated"));
  }
}

function getDeviceId() {
  const key = "kurukoo-device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, id);
  return id;
}
