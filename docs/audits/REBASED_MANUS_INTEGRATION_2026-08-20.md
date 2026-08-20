# Rebased Manus Integration Candidate

The original `integration/near-completion` branch was 59 commits behind current `main` and therefore was not merged directly.

A fresh `integration/near-completion-rebased` branch was created from the current `main` tree and reconciled with the Manus convergence branch by making current `main` authoritative for overlapping files. The Manus head is retained as a second merge parent for traceability.

This preserves newer Discover, mobile, frontend and backend changes while retaining the Manus convergence work in repository history.

## Validation gate

The branch is the merge candidate for:
- lint
- route suite
- FastText build/test/evaluation
- AI resilience/telemetry tests
- agent inference-budget tests
- provider credential-control tests
- high-write persistence tests
- discovery tests
- scenario/outcome convergence tests
- Expo mobile parity/typecheck/test/build
- staging smoke checks
- configured external-provider probes.

No green result is claimed until the GitHub Actions run for this exact merge candidate completes.
