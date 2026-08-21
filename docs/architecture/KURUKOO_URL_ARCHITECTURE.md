# Kurukoo Canonical URL Architecture

**Status:** Target architecture / migration contract

## Governing rules

1. A URL identifies a product resource or product surface, not an implementation file.
2. Public, authenticated, admin and API namespaces are distinct.
3. The authenticated browser OS lives under `/app/*` except the universal conversation entry `/chat` and intentionally public knowledge/content surfaces.
4. Admin browser URLs live under `/admin/*`; `.html` filenames and `?section=` query navigation are legacy implementation details, not canonical URLs.
5. Backend APIs live under `/api/v1/*`. Legacy `/api/*` endpoints may remain as compatibility aliases during migration but must not be emitted by frontend code.
6. API resource nouns are plural where a collection is represented; nested resources express ownership or context.
7. Route aliases redirect to one canonical URL with a permanent redirect where safe.
8. Query parameters are for filtering, sorting, pagination, experiments and transient state; they are not used as the primary identity of a page/module.
9. Human-readable public content uses slugs; internal IDs may be used for authenticated/admin resources when the object itself is private.
10. Native/PWA deep links map to canonical web destinations where a web representation exists.

## Canonical browser URL tree

### Public discovery / knowledge

- `/`
- `/explore`
- `/explore/:category`
- `/discover`
- `/network`
- `/channels`
- `/topics`
- `/topics/:slug`
- `/resources`
- `/resources/:slug`
- `/how-it-works`
- `/about`
- `/help`
- `/contact`
- `/careers`
- `/partners`
- `/advertise`
- `/pricing`
- `/blog`
- `/legal`
- `/legal/:document`
- `/developers`
- `/developers/api`

### Universal conversation

- `/chat`
- `/chat/:conversationId` only if stable shareable conversation URLs are intentionally supported; otherwise conversation identity remains application state and `/chat` stays canonical.
- `/start` is a contextual entry resolver only; it validates QR context and redirects to `/chat` with the validated context.

### Authenticated Web App

- `/app` → authenticated OS landing / Agent
- `/app/agent`
- `/app/discover`
- `/app/topics`
- `/app/requests`
- `/app/requests/:requestId`
- `/app/reminders`
- `/app/reminders/:reminderId`
- `/app/saved`
- `/app/cart`
- `/app/tasks`
- `/app/tasks/:taskId`
- `/app/connect`
- `/app/connect/:connectionId`
- `/app/agents`
- `/app/agents/:agentId`
- `/app/capabilities`
- `/app/opportunities`
- `/app/opportunities/:opportunityId`
- `/app/wallet`
- `/app/points`
- `/app/top-up`
- `/app/subscriptions`
- `/app/checkout`
- `/app/confirmations`
- `/app/memory`
- `/app/artifacts`
- `/app/prayer`
- `/app/call`
- `/app/notifications`
- `/app/safety`
- `/app/settings`

### Admin / Control Room

- `/admin`
- `/admin/login`
- `/admin/conversations`
- `/admin/providers`
- `/admin/economic`
- `/admin/moderation`
- `/admin/compliance`
- `/admin/notifications`
- `/admin/integrations`
- `/admin/agents`
- `/admin/users`
- `/admin/pricing`
- `/admin/referrals`
- `/admin/commissions`
- `/admin/partnerships`
- `/admin/scam`
- `/admin/social`
- `/admin/creators`
- `/admin/celebrity`
- `/admin/analytics`
- `/admin/revenue`
- `/admin/marketing`
- `/admin/advertising`
- `/admin/content`
- `/admin/curation`
- `/admin/settings`
- `/admin/seo`
- `/admin/roadmap`
- detail routes should use nested resource URLs, e.g. `/admin/users/:userId`, `/admin/providers/:providerId`, `/admin/requests/:requestId`.

## Canonical API URL tree

The next API version namespace is `/api/v1`.

### Core

- `/api/v1/auth/*`
- `/api/v1/users/me`
- `/api/v1/conversations/*`
- `/api/v1/chat/*`
- `/api/v1/memory/*`
- `/api/v1/notifications/*`
- `/api/v1/reminders/*`
- `/api/v1/tasks/*`

### Economic

- `/api/v1/requests/*`
- `/api/v1/orders/*`
- `/api/v1/cart/*`
- `/api/v1/checkout/*`
- `/api/v1/payments/*`
- `/api/v1/subscriptions/*`
- `/api/v1/wallet/*`
- `/api/v1/points/*`
- `/api/v1/disputes/*`

### Network / discovery

- `/api/v1/discovery/*`
- `/api/v1/presence/*`
- `/api/v1/opportunities/*`
- `/api/v1/providers/*`
- `/api/v1/capabilities/*`
- `/api/v1/connections/*`
- `/api/v1/channels/*`
- `/api/v1/topics/*`
- `/api/v1/content/*`

### Agents / voice / files

- `/api/v1/agents/*`
- `/api/v1/voice/*`
- `/api/v1/calls/*`
- `/api/v1/artifacts/*`
- `/api/v1/qr/*`

### Platform / admin

- `/api/v1/platform/*`
- `/api/v1/admin/*`
- `/api/v1/admin/...` remains operational and permission-gated; browser Admin pages must not call undocumented root-level API aliases directly.

### Health / readiness

- `/health`
- `/ready`
- `/live`

These may remain outside `/api` because they are infrastructure endpoints.

## Legacy aliases to canonical routes

During migration, retain server-side redirects/compatibility handlers for existing URLs such as:

- `/web` → `/app`
- `/workspace` → `/app`
- `/requests` → `/app/requests`
- `/reminders` → `/app/reminders`
- `/saved` → `/app/saved`
- `/cart` → `/app/cart`
- `/points` → `/app/points`
- `/tasks` → `/app/tasks`
- `/memory` → `/app/memory`
- `/safety` → `/app/safety`
- `/call` → `/app/call`
- `/connect` → `/app/connect`
- `/confirmation` → `/app/confirmations`
- `/subscription` → `/app/subscriptions`
- `/top-up` → `/app/top-up`
- `/discover` is public and authenticated discovery must use `/app/discover`; do not silently conflate the two audiences.
- `/admin/*.html` → canonical `/admin/*`
- `/admin/?section=<name>` → canonical `/admin/<name>`

Aliases must never be emitted by canonical navigation, feature registries, SEO metadata or new application code.

## Implementation / repository rule

Filesystem placement is allowed to differ from public URL structure. EJS templates, static HTML, React/Expo screens, route modules and service files are implementation details.

The URL contract belongs in one route registry and is consumed by:

- public navigation;
- authenticated Web App navigation;
- Admin navigation;
- feature visual registry;
- SEO canonical generation;
- redirects/aliases;
- Playwright route walkthrough;
- native deep-link mapping.

A page is not considered migrated until its canonical URL, owner, navigation links, SEO metadata, aliases and test coverage all agree.
