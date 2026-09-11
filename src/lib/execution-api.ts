export type ExecutionMode = { id: string; title: string; description: string; prompt: string };
export type ExecutionSurface = { id: string; title: string; path: string; description: string };
export type ExecutionOverview = {
  success: boolean;
  product: { name: string; promise: string; primaryAction: string };
  executionLoop: string[];
  modes: ExecutionMode[];
  surfaceGroups: ExecutionSurface[];
  readiness?: Record<string, unknown>;
  integrationCount: number;
  enabledIntegrationCount: number;
  featureCount: number;
  features: Array<Record<string, unknown>>;
};

const API_BASE = (import.meta.env["VITE_KURUKOO_API_BASE_URL"] ?? "").replace(/\/$/, "");

export async function fetchExecutionOverview(): Promise<ExecutionOverview | null> {
  try {
    const response = await fetch(`${API_BASE}/api/execution/overview`, { credentials: "include" });
    if (!response.ok) return null;
    return await response.json() as ExecutionOverview;
  } catch {
    return null;
  }
}
