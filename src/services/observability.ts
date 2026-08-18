import crypto from 'node:crypto';

export interface NetworkMetricSnapshot {
  startedAt: string;
  uptimeSeconds: number;
  requestsTotal: number;
  requests5xx: number;
  requestLatencyMs: { count: number; sum: number; p50: number; p95: number; p99: number };
  route5xx: Record<string, number>;
  route4xx: Record<string, number>;
  activeRequests: number;
  lastRequestAt?: string;
}

const startedAt = Date.now();
const counters = { requests: 0, errors5xx: 0, active: 0 };
const route5xx = new Map<string, number>();
const route4xx = new Map<string, number>();
const latencies: number[] = [];
const MAX_LATENCY_SAMPLES = 10_000;

function normalizeRoute(pathname: string): string {
  return String(pathname || '/')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/\+?\d{7,15}(?=\/|$)/g, '/:phone')
    .slice(0, 180) || '/';
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1);
  if (map.size > 200) {
    const oldest = map.keys().next().value;
    if (oldest) map.delete(oldest);
  }
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return Math.round(sorted[index]);
}

export function createRequestId(existing?: string): string {
  const normalized = String(existing || '').trim();
  return normalized.slice(0, 128) || crypto.randomUUID();
}

export function recordRequest(pathname: string, status: number, durationMs: number): void {
  counters.requests += 1;
  counters.active = Math.max(0, counters.active - 1);
  latencies.push(Math.max(0, durationMs));
  if (latencies.length > MAX_LATENCY_SAMPLES) latencies.splice(0, latencies.length - MAX_LATENCY_SAMPLES);
  const route = normalizeRoute(pathname);
  if (status >= 500) {
    counters.errors5xx += 1;
    increment(route5xx, route);
  } else if (status >= 400) {
    increment(route4xx, route);
  }
}

export function beginRequest(): void {
  counters.active += 1;
}

export function getNetworkMetricSnapshot(): NetworkMetricSnapshot {
  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    requestsTotal: counters.requests,
    requests5xx: counters.errors5xx,
    requestLatencyMs: {
      count: latencies.length,
      sum: Math.round(latencies.reduce((sum, value) => sum + value, 0)),
      p50: percentile(latencies, 0.50),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
    },
    route5xx: Object.fromEntries(route5xx),
    route4xx: Object.fromEntries(route4xx),
    activeRequests: counters.active,
  };
}

export function metricsPrometheus(): string {
  const snapshot = getNetworkMetricSnapshot();
  const lines = [
    '# HELP kurukoo_uptime_seconds Process uptime in seconds.',
    '# TYPE kurukoo_uptime_seconds gauge',
    `kurukoo_uptime_seconds ${snapshot.uptimeSeconds}`,
    '# HELP kurukoo_http_requests_total Total HTTP requests observed by this process.',
    '# TYPE kurukoo_http_requests_total counter',
    `kurukoo_http_requests_total ${snapshot.requestsTotal}`,
    '# HELP kurukoo_http_5xx_total Total HTTP 5xx responses observed by this process.',
    '# TYPE kurukoo_http_5xx_total counter',
    `kurukoo_http_5xx_total ${snapshot.requests5xx}`,
    '# HELP kurukoo_http_requests_active Current in-flight HTTP requests.',
    '# TYPE kurukoo_http_requests_active gauge',
    `kurukoo_http_requests_active ${snapshot.activeRequests}`,
    '# HELP kurukoo_http_request_duration_ms_p50 Approximate p50 request duration.',
    '# TYPE kurukoo_http_request_duration_ms_p50 gauge',
    `kurukoo_http_request_duration_ms_p50 ${snapshot.requestLatencyMs.p50}`,
    '# HELP kurukoo_http_request_duration_ms_p95 Approximate p95 request duration.',
    '# TYPE kurukoo_http_request_duration_ms_p95 gauge',
    `kurukoo_http_request_duration_ms_p95 ${snapshot.requestLatencyMs.p95}`,
    '# HELP kurukoo_http_request_duration_ms_p99 Approximate p99 request duration.',
    '# TYPE kurukoo_http_request_duration_ms_p99 gauge',
    `kurukoo_http_request_duration_ms_p99 ${snapshot.requestLatencyMs.p99}`,
  ];
  for (const [route, count] of Object.entries(snapshot.route5xx)) lines.push(`kurukoo_http_route_5xx_total{route=${JSON.stringify(route)}} ${count}`);
  for (const [route, count] of Object.entries(snapshot.route4xx)) lines.push(`kurukoo_http_route_4xx_total{route=${JSON.stringify(route)}} ${count}`);
  return `${lines.join('\n')}\n`;
}

export function safeErrorId(): string { return crypto.randomUUID(); }

export function logStructured(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    service: 'kurukoo',
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
