# Kurukoo ↔ ChatGPT App / MCP Integration

**Status:** Repository integration implemented; external publication/allowlisting remains a deployment/platform configuration step.

## Purpose

Kurukoo exposes a remote MCP endpoint so a user can connect their Kurukoo account to ChatGPT and use ChatGPT as an external controller of the same canonical Kurukoo OS. ChatGPT is an interface/agent client; Kurukoo remains the authority for identity, context, authorization, state mutation, evidence, confirmation, payment boundaries, and fulfilment.

This is intentionally **ChatGPT → Kurukoo**, not a mechanism for Kurukoo to impersonate or consume a user's personal ChatGPT subscription.

## Endpoint

- MCP endpoint: `/mcp`
- OAuth authorization endpoint: `/oauth/authorize`
- OAuth token endpoint: `/oauth/token`
- OAuth revocation endpoint: `/oauth/revoke`
- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authorization server metadata: `/.well-known/oauth-authorization-server`
- Client ID metadata: `/.well-known/oauth-client-metadata`

The endpoint is remote and must use HTTPS in production. It uses JSON-RPC over the current Streamable HTTP-style MCP transport. Legacy HTTP+SSE is not implemented.

## OAuth model

Kurukoo uses an authorization-code flow with PKCE for the ChatGPT-facing connection.

Required production environment:

- `KURUKOO_MCP_ENABLED=true`
- `KURUKOO_MCP_ISSUER=https://<public-kurukoo-origin>`
- `KURUKOO_MCP_CLIENT_ID=<registered-client-id>`
- `KURUKOO_MCP_REDIRECT_URIS=<exact,comma-separated,registered-redirect-uris>`
- `KURUKOO_MCP_CLIENT_SECRET=<secret>` when the configured ChatGPT app uses confidential-client authentication

Optional:

- `KURUKOO_MCP_OAUTH_SECRET` — separate signing secret; otherwise the existing `JWT_SECRET` is reused.
- `KURUKOO_MCP_ACCESS_TOKEN_TTL_SECONDS` — defaults to 3600.
- `KURUKOO_MCP_REFRESH_TOKEN_TTL_SECONDS` — defaults to 90 days.

Access and refresh tokens are stored hashed. Raw refresh tokens are never persisted. Authorization codes are single-use, short-lived and PKCE-bound.

## Permissions / scopes

- `kurukoo.read` — read the user's authorized Kurukoo context and capability state.
- `kurukoo.act` — perform low-risk canonical actions through the universal capability executor.
- `kurukoo.write` — state changes that the canonical interaction policy permits.
- `kurukoo.execute` — request external execution; payment, emergency, high-risk and unsupported external outcomes remain subject to existing confirmation and evidence boundaries.

OAuth scope is only the external permission layer. Kurukoo still validates exact ownership, capability registration, action support, confirmation, idempotency, lifecycle and evidence state.

## MCP tool contract

The server exposes five high-level tools:

- `kurukoo.get_context` — read the authenticated user's current relationship/continuation context.
- `kurukoo.list_capabilities` — read the canonical capability catalogue with risk, activation and evidence semantics.
- `kurukoo.inspect` — inspect an exact user-owned canonical object where a read projection exists.
- `kurukoo.find` — return capability routing guidance from the canonical capability catalogue; it does not invent provider availability.
- `kurukoo.execute` — execute a canonical capability proposal through `executeCanonicalCapabilityProposal` using the existing ownership, confirmation, idempotency, evidence and external-activation boundaries.

The server deliberately does not expose arbitrary SQL, raw database access, provider credentials, direct payment primitives or a second agent runtime.

## Confirmation and evidence

A successful MCP tool response means Kurukoo accepted and processed the canonical tool invocation. It does **not** mean an external provider, payment rail, dispatch network, device, messaging provider or emergency service completed an action unless the returned evidence/activation state proves that outcome.

## Account linking

The OAuth authorization screen uses Kurukoo's existing OTP-first identity model. Users authenticate to Kurukoo; Kurukoo never receives or stores ChatGPT passwords or session credentials.

The OAuth connection can be revoked through the token revocation endpoint. Access is therefore user-bound and can be terminated without changing the underlying Kurukoo account.

## Product surface

The existing Channels surface now identifies ChatGPT as an AI connection and links back into the same connection/workspace area. No second connection page or second design system was introduced; the integration uses the existing Channels card language and shared CSS.

## ChatGPT configuration

In a ChatGPT environment that supports custom MCP apps, add the remote MCP endpoint, select OAuth, complete Kurukoo authorization, scan the tools and enable the app. OpenAI's current availability, write permissions and supported surfaces vary by plan/workspace, so Kurukoo does not claim that every ChatGPT plan or agent surface can use every write action. The remote MCP server remains standards-aligned independently of those product-surface constraints.

## Security boundary

Production deployment must fail closed unless the public HTTPS issuer, OAuth client identity and exact redirect allow-list are configured. Do not use a wildcard redirect URI. Keep client secrets in deployment secrets, not source control.

## Verification

The repository contains `scripts/test-mcp-app.ts`, which exercises the OAuth transaction, PKCE code exchange, token verification, MCP tool catalogue, authenticated context read and a real canonical reminder execution against a disposable test database. CI runs this contract after build/tests.

## Reuse mandate

The integration deliberately reuses:

- Kurukoo OTP-first authentication and identity.
- `universalCapabilityProtocol.ts`.
- `canonicalCapabilityExecutor.ts`.
- Brain/context arbitration and conversation continuity semantics.
- Existing idempotency, exact-owner verification, confirmation policy, evidence and agent/runtime authorities.
- Existing Channels surface and design tokens.

No second AI engine, memory engine, request engine, payment engine, agent runtime or parallel connector-state architecture is introduced.
