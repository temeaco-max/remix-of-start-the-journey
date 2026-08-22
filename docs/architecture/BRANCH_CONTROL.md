# Kurukoo Branch Control

**Canonical branch:** `main`

As of 22 August 2026 there are no open pull requests in the repository. `main` is the only branch from which current product truth may be inferred.

## Rules

1. New work uses one short-lived branch from current `main`.
2. A branch may have one purpose and one PR.
3. No long-lived `integration/*`, `convergence-*`, `near-completion-*`, `final-*` or duplicate architecture branches.
4. Before merge, compare the branch with current `main`; unique work is merged, duplicate/superseded work is discarded.
5. After merge/closure, delete the branch. Branch refs are not a source of product truth.
6. A branch without an open PR is not evidence that its work is current.
7. A closed PR is historical evidence only.
8. `main` must remain buildable and must not be used as a staging area for competing architectures.

## Current cleanup state

The repository still contains historical branch refs created during earlier convergence work. They are not current architecture authorities and no open PR depends on them. GitHub branch deletion is a repository-ref maintenance operation; the connected automation available to this agent can inspect branches and close/merge PRs but cannot delete remote branch refs. Therefore this document deliberately does **not** claim those refs have been deleted.

The remaining refs should be deleted in GitHub after confirming they contain no unique unreconciled work. The safe default is to retain only `main` plus a small number of genuinely active short-lived branches.

## Engineering-control guarantee

Even while historical refs exist, they cannot become a competing product truth because:

- no open PR is allowed to represent an alternative current architecture;
- `CURRENT_PRODUCT_TRUTH.md` names `main` as the current-state base;
- tests/registries on historical branches do not upgrade current verification;
- every future PR must be compared with current `main` before merge.
