# Kurukoo ↔ ChatGPT App / MCP Integration

**Status:** Implemented repository integration; external publication/allowlisting remains a deployment/platform configuration step.

## Purpose

Kurukoo exposes a standards-aligned remote MCP endpoint so a user can connect their Kurukoo account to ChatGPT and use ChatGPT as an external controller of the same canonical Kurukoo OS. ChatGPT is an interface/agent client; Kurukoo remains the authority for identity, context, authorization, state mutation, evidence, confirmation, payment boundaries, and fulfilment.

This is intentionally **ChatGPT → Kurukoo**, not a mechanism for Kurukoo to impersonate or consume a user's personal ChatGPT subscription.

## Endpoint

- MCP endpoint: `/mcp`
- OAuth authorization endpoint: `/oauth/authorize`
- OAuth token endpoint: `/oauth/token`
- OAuth revocation endpoint: `/oauth/revoke`
- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authorization server metadata: `/.well-known/oauth-authorization-server`
- Client ID metadata: `/.well-known/oauth-client-metadata` (optional fallback for the deployment owner; MCP clients may use CIMD directly)

The endpoint is remote, HTTPS-only in production, and uses Streamable HTTP-style JSON-RPC requests. Legacy HTTP+SSE is not implemented because current MCP guidance treats it as deprecated.

## OAuth model

Kurukoo uses OAuth 2.1 authorization-code flow with PKCE for the ChatGPT-facing connection.

Environment:

- `KURUKOO_MCP_ENABLED=true` activates the integration.
- `KURUKOO_MCP_ISSUER` is the canonical public HTTPS origin, for example `https://kurukoo.ai`.
- `KURUKOO_MCP_CLIENT_ID` and `KURUKOO_MCP_CLIENT_SECRET` are optional for deployments using a pre-registered confidential client. MCP Client ID Metadata Documents are supported for public clients.
- `KURUKOO_MCP_ACCESS_TOKEN_TTL_SECONDS` defaults to 3600.
- `KURUKOO_MCP_REFRESH_TOKEN_TTL_SECONDS` defaults to 90 days.

Access and refresh tokens are stored hashed. Raw refresh tokens are never persisted. Authorization codes are single-use, short-lived and PKCE-bound.

## Permissions / scopes

Kurukoo intentionally exposes a small, semantic scope model instead of database access:

- `kurukoo.read` — read the user's authorized Kurukoo context and capability state.
- `kurukoo.act` — perform low-risk canonical actions through the universal capability executor.
- `kurukoo.write` — create/update user-owned state where the canonical interaction policy permits it.
- `kurukoo.execute` — request external execution; payment, emergency, high-risk, and unsupported external outcomes remain subject to Kurukoo's existing confirmation and evidence boundaries.

Users grant scopes during OAuth. The MCP server checks both OAuth scope and Kurukoo capability policy; possessing a scope never bypasses canonical ownership or confirmation checks.

## MCP tool contract

The server exposes high-level tools that map to existing canonical services:

- `kurukoo.get_context` — active user context and exact continuation information.
- `kurukoo.list_capabilities` — canonical capability descriptors and activation/evidence states.
- `kurukoo.inspect` — read an exact canonical object through the universal result projection where supported.
- `kurukoo.execute` — propose/execute a canonical capability action through `executeCanonicalCapabilityProposal` using idempotency and owner checks.
- `kurukoo.find` — retrieve provider/discovery context via existing discovery services where available.
- `kurukoo.status` — inspect the authoritative status of an exact request/goal/reminder/notification/etc. where the capability owner exposes it.

The server deliberately does not expose arbitrary SQL, raw database access, direct mutation endpoints, or provider credentials.

## Confirmation and evidence

ChatGPT may ask the user for confirmation for actions with Kurukoo's `confirmationRequired` semantics. Kurukoo independently evaluates the request. A successful HTTP response from `/mcp` means the canonical service accepted the tool call; it does not mean an external provider, payment rail, dispatch network, or device completed an action. The returned `evidenceLevel` and `externalActivation` fields are authoritative.

## Account linking

The OAuth authorization screen uses Kurukoo's existing OTP-first identity model. A user who is not currently signed in to Kurukoo is asked to authenticate, then returns to the exact pending OAuth transaction. No ChatGPT credentials are collected by Kurukoo.

Revoking the connection removes the OAuth refresh/access credentials and stops further ChatGPT calls from acting as the Kurukoo account until the user reconnects.

## ChatGPT configuration

In a ChatGPT environment that supports custom MCP apps, add the remote MCP endpoint, choose OAuth, complete the authorization flow, scan the available tools, and enable the app. OpenAI's current rollout and action availability vary by plan/workspace; in particular, full write/modify MCP support is currently workspace-oriented and ChatGPT agent mode does not currently consume custom apps. Kurukoo therefore treats the MCP server as a standards-compliant integration point rather than assuming every ChatGPT surface has identical permissions.

Before production publication:

1. Set the public HTTPS issuer and secure secrets.
2. Configure the production OAuth redirect/client relationship required by the ChatGPT app surface.
3. Verify TLS, proxy forwarding, `SameSite`/secure cookie behavior and rate limits.
4. Enable `KURUKOO_MCP_ENABLED` only after the deployment passes the MCP contract test.
5. Publish/allowlist the ChatGPT app in the relevant OpenAI workspace/app directory according to OpenAI's current app process.

## Reuse mandate

This integration deliberately reuses:

- `authenticateUser` / OTP-first Kurukoo identity.
- `canonicalCapabilityExecutor.ts`.
- `universalCapabilityProtocol.ts`.
- Brain/context arbitration and conversation continuity semantics.
- Existing idempotency, owner verification, confirmation policy, evidence, notification and agent runtime services.
- Existing public design tokens and Channels surface.

No second AI engine, memory engine, request engine, payment engine, agent runtime, or connector state store is introduced.
