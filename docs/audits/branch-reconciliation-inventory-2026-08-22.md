# Branch and Manus Workspace Reconciliation Inventory

**Recorded:** 22 August 2026
**Purpose:** Preserve the active external branch/workspace findings requested for end-to-end completion. This record is an inventory, not approval to merge every branch wholesale.

## Active Pull Requests

| Pull request | Head | Scope observed | Compatibility status |
|---|---|---|---|
| [#64](https://github.com/temeaco-max/kurukoo/pull/64) — *feat: weave Kurukoo OS end-to-end* | `feature/platform-convergence-frames` at `a83606b4` | 75-file, 2,644 insertions / 1,165 deletions branch with public, Admin, Chat, native, workflow, service, route and test work. It overlaps already-reconciled current-main visual owners including `views/app.ejs`, `views/_partials/head.ejs`, Admin, Chat and Desk assets. | **Requires selective owner-by-owner reconciliation.** It is not safe to merge wholesale because it combines legacy static-shell work and backend/platform changes with the visual work. |
| [#68](https://github.com/temeaco-max/kurukoo/pull/68) — *feat: weave Quick Ride into canonical Kurukoo OS* | `feature/kurukoo-os-weave-current` at `cb7c5593` | Adds Quick Ride dispatch contracts, route registration, service wiring, a native contract, offline/QR support and an OS-weave contract test. | **Backend/runtime branch.** Its saved Quick Ride contract passes in an isolated worktree, but repository TypeScript currently fails on a pre-existing `deskVisualFoundation.ts` parse error. The PR is draft/unstable and must be completed through its runtime contract rather than represented as a visual-only merge. |

## Branch-Specific Findings

The Quick Ride saved contract test passed in the isolated branch worktree and confirms the expected dispatch owners, registration markers, provider-acceptance lead charging, and WebRTC-first communication boundary. Its route validates authentication, coordinates and destination presence before creating an economic request and broadcasting dispatch. It does not itself label a provider, payment, arrival or delivery complete.

The branch lint check could not complete initially because the isolated worktree did not have installed dependencies. After using the repository dependency tree, it reached TypeScript parsing and failed on `src/services/deskVisualFoundation.ts`; that file is unchanged between remote `main` and the Quick Ride branch, so it is a repository baseline issue rather than Quick Ride branch-specific work.

The broad platform-frames branch has six direct overlaps with the local visual convergence commits: `public/admin/index.html`, `public/chat/index.html`, `public/css/kurukoo-os-architecture.css`, `public/js/kurukoo-os-dashboard.js`, `views/_partials/head.ejs`, and `views/app.ejs`. Its static `dashboard.html`, `discover/index.html` and `settings.html` changes must be treated as legacy/supporting-shell work until current route ownership confirms a live production owner.

## Manus-Created Workspace

`/home/ubuntu/kurukoo-visual-audit` contains the visual convergence specification in `ideas.md` and no separate product implementation. Its specification agrees with the repository's existing warm cream/white/charcoal/terracotta visual authority, conversation-first continuity, 44px interactions and evidence-gated external states. It is a design handoff rather than unfinished route or runtime code.

## Development Branch Recovery Finding

Remote `develop` at `f2816159` is an active broader completion line that is 48 commits ahead of remote `main`, while remote `main` has 809 commits not on `develop`. It contains a complete 618-line `src/database.ts` that exports `saveDb` and `CANONICAL_OPERATOR_PHONE`, unlike the truncated 47-line current-main file. Its latest database-owner change is contained in development checkpoint `58edd087` alongside workspace, route, artifact and documentation changes.

An isolated `--no-commit` merge preview from the current local main into `origin/develop` reported conflicts across Docker/CI, data/service contracts, canonical routes, Admin, Chat, workspace/public views, CSS authorities and the shared database owner. The preview was immediately aborted; no current-main file was overwritten. The result confirms that `develop` is a recovery/reference source for specific completed owners, not a safe wholesale merge target.

The shared `src/services/deskVisualFoundation.ts` parse defect was repaired locally before this preview. A subsequent lint reaches the wider current-main persistence/type contract failures, principally the absent `saveDb` database export and related stale type definitions. This is now a repository-level recovery boundary to be reconciled owner-by-owner, not a Quick Ride-only failure.

## Reconciled Quick Ride Work

The compatible Quick Ride owners from PR #68 were integrated into the current reconciliation line: the canonical ride vehicle contract, validated authenticated `/api/rides/options` and `/api/rides/quick` route, request-to-economic-dispatch service, mobile request-state contract, bounded offline queue/sync lifecycle, QR context parser and native QR entry screen. The application entry already registered the missing Quick Ride router; adding the route owner repairs that unresolved import without changing route registration order.

The native offline lifecycle removes a pending action only after the current streaming client produces a non-empty reply. Failed streams therefore remain queued for a later connectivity attempt. The QR entry accepts only HTTPS `kurukoo.ai/start?qr=` links with a bounded signed token shape, makes camera permission/recovery states explicit and returns to the prior native screen after opening the validated context.

| Quick Ride validation | Result |
|---|---|
| Saved OS-weave ownership contract | Passed; 13 canonical owners and registration markers observed. |
| Native TypeScript check | Passed after aligning the branch retry call with the current `streamChatMessage` request contract. |
| Native lint | Passed with the pre-existing four warnings only. |
| Focused native visual/continuity/work-surface suite | Passed; 13 tests. |

PR #64 remains a selective-reference source. Its current visual owners are already represented or overlap current-main convergence work, while its static dashboard/discover/settings files are not canonical live route owners. Its backend, CI and runtime changes must be independently completed and tested rather than merged in bulk over the reconciled visual line.

## Current-Main-Precedence Candidate Map

The selected policy is **current-main precedence**. The development branch has 92 changed presentation-facing files, but the live current-main routes already own the corresponding public, workspace, Chat, Admin and native surfaces. The branch-only CSS and JavaScript assets (`about-help-authority`, `admin-authority`, `chat-authority`, `confirmations-authority`, `radar-authority`, voice-note and board-state scripts) have no live current-main template or client-entry reference. The branch-only `home_hero_fixture` and `about_help` templates are likewise not live route owners.

Accordingly, no branch-only legacy shell or unreferenced asset was copied into the current application. The compatible, owner-backed Quick Ride work was integrated; existing current-main public, Chat, Desk/workspace, Discover, Admin and native owners remain the authoritative presentation implementations. This avoids reintroducing a second CSS layer, a stale static dashboard/discover/settings shell, or a competing navigation/runtime path.

## ChatGPT-Attributed Work Inventory

Repository history contains a set of ChatGPT-labelled integration commits covering the remote ChatGPT MCP contract, Channels readiness, MCP endpoint documentation, the authenticated workspace shell, router mounting and security audit work. No remote branch is explicitly named for ChatGPT/OpenAI/GPT, and every identified commit is already contained by remote `main` and the active reconciliation branches. The local Manus workspace contains a design specification only; no separate ChatGPT-created implementation workspace was found.

Under current-main precedence, these commits are treated as historical implementation lineage rather than a separate unfinished code source. Their live surface owners—Channels, authenticated workspace, public developer/API guidance and connection readiness—were already covered by the current-main visual and branch-reconciliation audits. No additional owner was found that could be safely imported as a distinct ChatGPT branch asset.

## Next Reconciliation Rule

> Compare every candidate owner against the current live route before integration. Reconcile compatible client/presentation work into the existing owner; complete runtime branches through their tests and contracts; do not revive static legacy shells, bypass provider/payment evidence, or merge a broad branch solely because it contains visual assets.

## References

[1]: https://github.com/temeaco-max/kurukoo/pull/64 "PR #64 — feat: weave Kurukoo OS end-to-end"
[2]: https://github.com/temeaco-max/kurukoo/pull/68 "PR #68 — feat: weave Quick Ride into canonical Kurukoo OS"
