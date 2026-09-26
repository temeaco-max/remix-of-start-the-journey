import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useCallback, useEffect, useState } from "react";

export interface PasskeyCredential {
  id: number | string;
  credentialId: string;
  name: string | null;
  credentialType: string;
  transports: string[];
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface PasskeyMetrics {
  totalUsers: number;
  usersWithPasskeys: number;
  totalPasskeys: number;
  syncedPasskeys: number;
  deviceOnlyPasskeys: number;
}

type ApiError = { message?: string; error?: string };
type RegistrationStart = {
  challenge: string;
  options: { publicKey: PublicKeyCredentialCreationOptionsJSON };
};
type AuthenticationStart = {
  challenge: string;
  options: { publicKey: PublicKeyCredentialRequestOptionsJSON };
};
type ListResponse = { success: boolean; credentials: PasskeyCredential[] };

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(endpoint, { ...options, headers, credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok)
    throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  return payload;
}

/**
 * Capability detection for passkeys (WebAuthn).
 * Returns `available: false` until the browser has been checked, so a dead
 * control is never rendered as if it were usable.
 */
export function usePasskeySupport() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const hasWebAuthn =
        typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.credentials;
      if (cancelled) return;
      if (!hasWebAuthn) {
        setAvailable(false);
        return;
      }
      let conditionalMediation = false;
      try {
        if (
          typeof window.PublicKeyCredential.isConditionalMediationAvailable === "function"
        ) {
          conditionalMediation = await window.PublicKeyCredential.isConditionalMediationAvailable();
        }
      } catch {
        conditionalMediation = false;
      }
      if (!cancelled) setAvailable(true);
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    available,
    conditionalMediation: undefined as boolean | undefined,
    reason: available ? null : "Passkeys need a supported browser, device or screen-lock. Use your email link or verification code instead.",
  };
}

export function usePasskey() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const start = await apiCall<RegistrationStart>("/api/auth/passkey/register/start", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const credential = await startRegistration({ optionsJSON: start.options.publicKey });
      await apiCall<{ success: boolean }>("/api/auth/passkey/register/complete", {
        method: "POST",
        body: JSON.stringify({ credential, name }),
      });
      return { success: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Registration failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const start = await apiCall<AuthenticationStart>("/api/auth/passkey/login/start", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      const credential = await startAuthentication({ optionsJSON: start.options.publicKey });
      const result = await apiCall<{ success: boolean; phone: string }>(
        "/api/auth/passkey/login/complete",
        {
          method: "POST",
          body: JSON.stringify({ phone, credential }),
        },
      );
      return { ...result, success: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Login failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall<ListResponse>("/api/auth/passkey/list");
      return { success: true, credentials: result.credentials };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to list passkeys";
      setError(message);
      return { success: false, error: message, credentials: [] as PasskeyCredential[] };
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(async (credentialId: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiCall<{ success: boolean }>(`/api/auth/passkey/${encodeURIComponent(credentialId)}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to remove passkey";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, login, reauth: login, list, revoke, loading, error };
}

export async function getPasskeyMetrics(): Promise<PasskeyMetrics | null> {
  try {
    const result = await apiCall<{ adoption?: PasskeyMetrics }>("/api/auth/identity/me");
    return result.adoption || null;
  } catch {
    return null;
  }
}

export async function getAdminPasskeyMetrics(): Promise<{
  metrics: PasskeyMetrics;
  credentials: Record<string, unknown>[];
} | null> {
  try {
    const result = await apiCall<{
      metrics: PasskeyMetrics;
      credentials: Record<string, unknown>[];
    }>("/api/admin/passkeys");
    return { metrics: result.metrics, credentials: result.credentials };
  } catch {
    return null;
  }
}

export async function revokeAdminPasskey(credentialId: string): Promise<boolean> {
  try {
    const result = await apiCall<{ success: boolean }>(
      `/api/admin/passkey/${encodeURIComponent(credentialId)}/revoke`,
      { method: "POST" },
    );
    return result.success;
  } catch {
    return false;
  }
}

export type { AuthenticationResponseJSON, RegistrationResponseJSON };
