# Kurukoo on Google Cloud Run

The repository contains a direct Cloud Run deployment path so Google AI Studio Build does not have to remain in the deployment chain.

## Deployment shape

```text
GitHub main
  ↓
Cloud Build
  ↓
Artifact Registry
  ↓
Cloud Run
  ↓
Kurukoo
  ├── Web / PWA / canonical Chat
  ├── SmolLM2 1.7B local inference when enabled
  └── stronger hosted AI fallback when configured
```

The existing `Dockerfile`, `deploy/cloud-run/service.yaml`, and `cloudbuild.yaml` are the canonical repository deployment artifacts.

## Build and deploy

From a Google Cloud project with Cloud Build, Artifact Registry and Cloud Run enabled:

```bash
gcloud builds submit . --config cloudbuild.yaml \
  --substitutions=_SERVICE=kurukoo,_REGION=europe-west2
```

The default proving profile is intentionally conservative for the 1.7B local model:

- Cloud Run: 4 vCPU
- memory: 4 GiB
- concurrency: 1
- request timeout: 300 seconds
- minimum instances: 0
- maximum instances: 3
- `KURUKOO_SMOLLM2_LOCAL=true`
- `SMOLLM2_MODEL=HuggingFaceTB/SmolLM2-1.7B-Instruct`
- `SMOLLM2_DTYPE=q4`
- model cache: `/tmp/huggingface`
- background workers disabled in the web process

These values are repository proving defaults, not claims about the cheapest production configuration. The 4 GiB profile is the explicit contract exercised by `test:cloud-run-smollm2`; measure actual Cloud Run startup, memory and latency before changing it.

## Secrets

Do not put API keys or JWT secrets in `cloudbuild.yaml`, the Docker image, or Git.

Configure production secrets through Google Cloud Secret Manager / Cloud Run environment configuration. At minimum the production service needs a strong `JWT_SECRET`; other credentials are only required for the corresponding external adapters.

## Runtime health

`/health` reports application/database health plus runtime model and external-adapter configuration state.

`/readyz` verifies that the application and database are available and that a model boundary is configured when `KURUKOO_CLOUD_RUN_REQUIRE_MODEL=true`.

The model is cached on the container's ephemeral filesystem. User/application state must remain in canonical persistent storage; a restarted Cloud Run instance must not be treated as durable user storage. The current SQL.js deployment is deliberately constrained to one application worker (`KURUKOO_WORKERS=1`) for safe process-local coordination. Increasing workers requires an approved multi-process persistence and distributed-limiting boundary; it is not enabled by merely changing the environment variable.

## SmolLM2 behaviour

The local model uses singleton loading inside `smolLm2Service.ts` and a bounded local inference section so concurrent Cloud Run requests do not initialise multiple copies of the model in one process.

When local SmolLM2 is unavailable, Kurukoo may use the configured hosted model boundary or the truthful bounded fallback. Production must not silently pretend an unavailable provider/model is active.

## Existing AI Studio deployment

Google AI Studio Build can continue to publish the same repository to Cloud Run. The direct Cloud Build path is an alternative that makes GitHub `main` the deployment source of truth.

No application architecture depends on AI Studio Build.

## External activation

Cloud Run hosting does not itself activate:

- payment settlement;
- WhatsApp/Telegram/SMS delivery;
- FCM push delivery;
- live voice/WebRTC providers;
- provider verification or availability;
- dispatch/logistics;
- real emergency call connection;
- trained/promoted SmolLM2 adapter.

Those remain independently configured and evidence-gated by the existing canonical boundaries.
