# Kurukoo External AI Channel / MCP Integration

**Status:** Repository integration implemented; provider-specific publication/allowlisting remains a deployment/platform configuration step.

## Purpose

Kurukoo exposes one remote MCP endpoint so compatible AI assistants can connect to a user's Kurukoo account and use the same canonical Kurukoo OS. ChatGPT is the first documented client, but the integration is intentionally provider-neutral for other MCP/custom-app capable assistants such as Claude, Gemini, Grok, Copilot, Dola and future clients where their own products support the required MCP flow.

The direction is **AI client → Kurukoo**. The external AI is another channel/interface; Kurukoo remains authoritative for identity, context, authorization, state mutation, evidence, confirmation, payment boundaries and fulfilment. Kurukoo does not impersonate or consume a user's personal subscription to another AI product.

## Endpoint

- MCP endpoint: `/mcp`
- OAuth authorization endpoint: `/oauth/authorize`
- OAuth token endpoint: `/oauth/token`
- OAuth revocation endpoint: `/oauth/revoke`
- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authorization server metadata: `/.well-known/oauth-authorization-server`
- Client ID metadata: `/.well-known/oauth-client-metadata`

The endpoint is remote and must use HTTPS in production. It uses the current Streamable HTTP-style JSON-RPC transport. Legacy HTTP+SSE is not implemented.

## OAuth model

Kurukoo uses an authorization-code flow with PKCE for external AI clients. The exact client registration and redirect relationship is provider-specific.

Required production environment:

- `KURUKOO_MCP_ENABLED=true`
- `KURUKOO_MCP_ISSUER=https://<public-kurukoo-origin>`
- `KURUKOO_MCP_CLIENT_ID=<registered-client-id>` where a fixed client is required
- `KURUKOO_MCP_REDIRECT_URIS=<exact,comma-separated,registered-redirect-uris>` when the client requires an allow-list
- `KURUKOO_MCP_CLIENT_SECRET=<secret>` only when the external client requires confidential-client authentication

Optional:

- `KURUKOO_MCP_OAUTH_SECRET` — separate signing secret; otherwise the existing `JWT_SECRET` is reused.
- `KURUKOO_MCP_ACCESS_TOKEN_TTL_SECONDS` — defaults to 3600.
- `KURUKOO_MCP_REFRESH_TOKEN_TTL_SECONDS` — defaults to 90 days.

Access and refresh tokens are stored hashed. Raw refresh tokens are never persisted. Authorization codes are single-use, short-lived and PKCE-bound.

## Permissions / scopes

- `kurukoo.read` — read the user's authorized Kurukoo context and capability state.
- `kurukoo.act` — perform low-risk canonical actions through the universal capability executor.
- `kurukoo.write` — state changes allowed by Kurukoo's canonical interaction policy.
- `kurukoo.execute` — request external execution; payment, emergency, high-risk and unsupported external outcomes remain subject to existing confirmation and evidence boundaries.

OAuth scope is only the external permission layer. Kurukoo still validates exact ownership, capability registration, action support, confirmation, idempotency, lifecycle and evidence.

## MCP tool contract

The endpoint exposes five high-level tools:

- `kurukoo.get_context` — read the authenticated user's current relationship and continuation context.
- `kurukoo.list_capabilities` — read the canonical capability catalogue with risk, activation and evidence semantics.
- `kurukoo.inspect` — inspect an exact user-owned canonical object where a read projection exists.
- `kurukoo.find` — return capability guidance from Kurukoo's existing capability catalogue; it does not invent provider availability.
- `kurukoo.execute` — execute a canonical capability proposal through `executeCanonicalCapabilityProposal` using existing ownership, confirmation, idempotency, evidence and external-activation boundaries.

No arbitrary SQL, raw database access, provider credentials, direct payment primitive or second agent runtime is exposed.

## Confirmation and evidence

A successful MCP response means Kurukoo accepted and processed the canonical invocation. It does **not** mean an external provider, payment rail, dispatch network, device, messaging provider or emergency service completed an action unless the returned evidence and activation state prove that outcome.

## Account linking

The OAuth authorization screen uses Kurukoo's existing OTP-first identity model. Users authenticate to Kurukoo; Kurukoo never asks for or stores credentials belonging to the external AI provider.

The OAuth connection can be revoked without changing the underlying Kurukoo account.

## Product surface

The existing Channels surface treats external AI assistants as one AI-channel category. It reuses the existing Channels cards, workspace connection surface and shared CSS/design tokens. No second AI dashboard or provider-specific UI system is required.

## Client compatibility

MCP support is ultimately determined by the external AI provider. Kurukoo supplies one standards-based endpoint; a provider may expose custom MCP apps/connectors, OAuth connections, write actions or only read actions according to its own product and plan. Kurukoo therefore reports client availability truthfully and does not claim that every provider or plan supports the same features.

## Security boundary

Production deployment must fail closed unless the public HTTPS issuer and required client registration/redirect constraints are configured. Never use wildcard redirects. Keep client secrets in deployment secrets.

## Verification

`scripts/test-mcp-app.ts` exercises the shared OAuth transaction, PKCE code exchange, token verification, MCP catalogue, authenticated context read and canonical reminder execution against a disposable test database. The test validates the generic MCP contract, not any one AI vendor's product UI.

## Reuse mandate

This integration deliberately reuses:

- Kurukoo OTP-first authentication and identity.
- `universalCapabilityProtocol.ts`.
- `canonicalCapabilityExecutor.ts`.
- Brain/context arbitration and conversation continuity semantics.
- Existing idempotency, exact-owner verification, confirmation policy, evidence and agent/runtime authorities.
- Existing Channels surface and design tokens.

No second AI engine, memory engine, request engine, payment engine, agent runtime, or parallel connector-state architecture is introduced.
