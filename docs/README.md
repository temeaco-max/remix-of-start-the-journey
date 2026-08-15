# Kurukoo Documentation Map

## Current authorities

The current repository and release authority is `main`. `README.md` provides the project overview and operating commands. `BLUEPRINT.md` is the product and architecture mandate. `BLUEPRINT_IMPLEMENTATION_ADDENDUM.md` records implementation clarifications. `BUILD_STATUS.md` is the current verification and release-status record. `SECURITY_AUDIT_STATUS.md` records current security posture and residual operational requirements. `CONTROLLED_PILOT.md` defines the controlled deployment profile.

`CHAT_SURFACE_CONTRACT.md` is the canonical protected Chat UI contract. `KURUKOO_PRODUCT_SYSTEM_MAP.md` maps the current product authorities. `KURUKOO_REFERENCE.md` is the compact reference. Policies such as `CACHING.md`, `DATA_RETENTION_POLICY.md`, `POINTS_COMPLIANCE.md`, `ECOSYSTEM.md`, and `WHATSAPP_CONTINGENCY.md` remain at the root because they are active supporting policies.

## Supporting documentation

Current product, architecture, and integration references are grouped under `docs/product/`, `docs/architecture/`, and `docs/integrations/` where applicable. These documents must not contradict the root authorities or claim capabilities that the runtime cannot evidence.

## Historical evidence

Historical audits and convergence records are stored under `docs/audits/`. Browser, acceptance, and test evidence is stored under `docs/verification/`. Older product notes and one-off planning material are stored under `docs/history/`. Historical branch names and baseline commits in those documents are evidence only; they are not current branch or deployment instructions.

## Source-of-truth rule

When documents disagree, prefer the current runtime and tests, then `BLUEPRINT.md`, `BUILD_STATUS.md`, and `SECURITY_AUDIT_STATUS.md` for current architecture and release truth. Do not use historical audit records as operational instructions.
