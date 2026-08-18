# Kurukoo Production Platform Contract

## Active launch substrate

The application currently remains compatible with the cost-effective single-instance SQL.js launch path:

```text
Node 22 / Express
       |
    SQL.js
       |
 durable filesystem volume
```

The repository now fails closed if production attempts to combine SQL.js with multiple application workers. This is intentional: process-local rate limits, in-memory coordination, and file-backed SQL.js state cannot safely become a horizontally scaled database simply by increasing replica count.

## Prepared production substrate

Repository infrastructure now includes a cutover-ready platform topology:

```text
                ┌───────────────┐
                │ Kurukoo app(s)│
                └───────┬───────┘
                        │
             ┌──────────┴──────────┐
             │                     │
        PostgreSQL               Redis
        persistence           distributed jobs/
                              coordination target
             │                     │
             └──────────┬──────────┘
                        │
               OpenTelemetry
                        │
                 Prometheus
```

`docker-compose.production.yml` provides these services for repeatable development/production-like validation. The app still defaults to `sqljs` + `in_process` because no PostgreSQL or Redis adapter has been falsely declared complete. `KURUKOO_DATABASE_MODE=postgres` and `KURUKOO_JOB_MODE=distributed` are reserved for the point at which the corresponding canonical persistence/job adapters are actually activated.

## Production topology invariants

- `KURUKOO_DATABASE_MODE=sqljs` requires `KURUKOO_WORKERS=1`.
- `KURUKOO_DATABASE_MODE=postgres` requires `DATABASE_URL`.
- `KURUKOO_JOB_MODE=distributed` requires `KURUKOO_REDIS_URL`.
- `KURUKOO_PERSISTENT_STATE_REQUIRED=true` rejects `/tmp` database paths in production.
- Sandbox payment is forbidden in production.
- MCP production activation requires HTTPS issuer, exact HTTPS redirect URIs, registered client identity, and a strong OAuth secret.
- Production startup rejects unsafe topology before the HTTP listener starts.

## Container

The existing `Dockerfile` is now hardened for production:

- Node 22 runtime.
- Reproducible npm install using the committed lockfile.
- Non-root `node` runtime.
- No development dependencies in the runtime image.
- `/readyz` container healthcheck.
- Persistent `/app/data` and upload paths remain external volumes.

## Kubernetes

`infra/kubernetes/base/` contains a portable baseline:

- namespace
- ConfigMap with truthful single-node defaults
- single-replica Deployment
- persistent data and upload PVCs
- ClusterIP Service
- PodDisruptionBudget

The Deployment intentionally starts at one replica. After the canonical PostgreSQL and distributed-job adapters are enabled, an environment overlay can safely raise replica count without changing the application contract.

## Observability

`src/services/observability.ts` and `src/middleware/observability.ts` provide:

- request/correlation IDs
- in-flight request tracking
- 4xx/5xx counters
- bounded latency sampling with p50/p95/p99
- structured JSON error events
- Prometheus-compatible `/metrics`
- existing `/health` and `/readyz` operational state

`infra/otel/collector.yaml` and `infra/prometheus/prometheus.yml` provide a repository-level metrics/telemetry topology.

## Nearby Pulse security contract

Internal Pulse matching retains exact coordinates, but public Pulse never exposes phone identifiers or exact coordinates. `toPublicPulseProviders()` produces a stable, fuzzed public projection with a declared location radius. Provider broadcasting also requires an explicitly verified and currently available provider profile.

Nearby Pulse remains presence evidence only. It does not itself claim a booking, quote, payment, dispatch, completion, or external contact event.

## Schema maintenance

`src/database.ts` remains the legacy runtime bootstrap schema. `data/audits/database-schema-manifest.json` records its immutable Git blob identity, and `scripts/audit-database-schema.mjs` fails CI when the schema changes without an explicit maintenance update.

This is deliberately a transition control rather than a fake migration framework. The next database evolution is to introduce a true versioned migration runner at the persistence boundary before changing production schema semantics or enabling PostgreSQL.

## Deployment preflight

`scripts/production-preflight.mjs` is fail-closed for production configuration and checks:

- identity secret strength
- database/worker topology
- durable state path
- production payment mode
- MCP security
- voice credentials when enabled
- external execution warning states

It does not pretend that credentials prove an external provider is actually live; provider readiness and evidence remain the responsibility of the existing adapter/readiness services.
