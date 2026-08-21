# Desktop live walkthrough

The desktop visual walkthrough is implemented by `scripts/run-desktop-playwright-walkthrough.mjs` and `.github/workflows/desktop-playwright-walkthrough.yml`.

## Reference sizes

The default run checks both desktop references:

- 1440×900
- 1280×800

Override with `KURUKOO_E2E_VIEWPORTS=1600x1000,1440x900` when comparing against a different reference set.

## What is checked

The walkthrough visits every declared public frontend route, every canonical authenticated Web App route, and every Admin desktop submodule. For each route it:

- captures a full-page screenshot;
- records browser console errors;
- records failed network requests and HTTP 5xx responses;
- detects horizontal overflow;
- detects protected-screen redirects to login;
- checks that the Admin shell is not duplicated;
- checks that the authenticated Web App shell exists;
- checks that Admin chrome does not leak into consumer/public surfaces;
- checks critical return/action links on Agent, Requests, Tasks, Connect, Memory, Notifications, Safety, Cart, Checkout and Confirmations.

## Manual run

```bash
npm install --no-save playwright
npx playwright install --with-deps chromium
KURUKOO_E2E_BASE_URL=https://your-deployment.example \
KURUKOO_E2E_AUTH_COOKIE='kurukoo_auth=...' \
KURUKOO_E2E_ADMIN_TOKEN='...' \
node scripts/run-desktop-playwright-walkthrough.mjs
```

The output is written to `artifacts/desktop-walkthrough/`, including `report.json` and per-route screenshots.

`KURUKOO_E2E_AUTH_COOKIE` is the authenticated browser cookie string used to enter the Web App routes without weakening production authentication. `KURUKOO_E2E_ADMIN_TOKEN` is injected into the Admin local-storage key used by the existing admin shell.

## GitHub Actions

Run **Desktop Playwright Walkthrough** manually from Actions and provide the deployed base URL. Configure the repository with:

- repository variable `KURUKOO_E2E_BASE_URL` for the default deployment;
- secret `KURUKOO_E2E_AUTH_COOKIE` for a disposable authenticated test account;
- secret `KURUKOO_E2E_ADMIN_TOKEN` for the Admin control-plane test token.

The workflow installs Chromium, runs the two desktop reference passes and uploads the screenshots plus JSON report as an artifact.

## Current verification limitation

The previous temporary Manus deployment used for browser acceptance testing is currently not resolvable from the present execution environment, so a fresh live screenshot run could not be truthfully claimed in this session. The repository already contains prior Playwright acceptance evidence for authenticated Chat, Requests, Reminders, Saved, Cart, Points, provider flows, contributor flows, ride cancellation, request persistence and other continuation paths in `docs/verification/playwright-cycle-findings.md`.
