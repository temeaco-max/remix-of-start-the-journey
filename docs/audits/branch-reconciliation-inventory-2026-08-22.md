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

## Next Reconciliation Rule

> Compare every candidate owner against the current live route before integration. Reconcile compatible client/presentation work into the existing owner; complete runtime branches through their tests and contracts; do not revive static legacy shells, bypass provider/payment evidence, or merge a broad branch solely because it contains visual assets.

## References

[1]: https://github.com/temeaco-max/kurukoo/pull/64 "PR #64 — feat: weave Kurukoo OS end-to-end"
[2]: https://github.com/temeaco-max/kurukoo/pull/68 "PR #68 — feat: weave Quick Ride into canonical Kurukoo OS"
