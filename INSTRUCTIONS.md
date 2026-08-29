# Kurukoo — Data Models & API Contracts

**Authority:** Data models and API contracts for the canonical Kurukoo implementation. This document supersedes any inline comments that conflict with explicit contracts. All server-side logic must validate inputs before trusting them.

**Last updated:** 2026-08-29

---

## 1. Authentication & Authorization

### 1.1 Identity Model
- **Primary identity:** Authenticated phone number (E.164 normalized).
- **Authentication:** JWT token issued after phone OTP verification.
- **Token storage:** HttpOnly, Secure, SameSite=Strict cookie (`token`).
- **Development auth:** `KURUKOO_DEV_AUTH=true` + `KURUKOO_TEST_PHONE` — only accepted when `NODE_ENV !== 'production'`.
- **Admin auth:** Separate admin authentication path (`authenticateAdmin` middleware).

### 1.2 Authorization Rules
- Users can only access their own resources (enforced server-side per request).
- Cross-user access to Economic Requests, escrow, disputes, or memory is forbidden.
- Provider delivery ownership: only the assigned provider's authenticated phone can advance order-delivery status.
- Safety/disputes require explicit owner-scoped authorization at canonical boundaries.

---

## 2. Core Data Models

### 2.1 `memory_profiles`
Canonical user profile and identity authority.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `phone` | TEXT | PRIMARY KEY | E.164 normalized phone number |
| `name` | TEXT | — | User display name |
| `email` | TEXT | — | Optional email address |
| `location` | TEXT | — | Optional location string |
| `primary_lga` | TEXT | — | Local Government Area |
| `primary_state` | TEXT | — | State |
| `country` | TEXT | DEFAULT 'ng' | ISO 3166-1 alpha-2 |
| `subscription_tier` | TEXT | DEFAULT 'Base' | Points-based tier |
| `points_balance` | INTEGER | DEFAULT 30 | Loyalty points (integer) |
| `wallet_balance_minor` | INTEGER | DEFAULT 30 | Wallet in minor currency units (pence/kobo) |
| `currency` | TEXT | DEFAULT 'NGN' | ISO 4217 currency code |
| `preferences` | TEXT | — | JSON-encoded preferences |
| `behavior_patterns` | TEXT | — | JSON-encoded behavior data |
| `inferred_roles` | TEXT | — | JSON-encoded roles |
| `grace_leads` | INTEGER | DEFAULT 0 | Grace period counter |
| `fcm_token` | TEXT | — | Firebase device token |
| `is_available` | INTEGER | DEFAULT 0 | Provider availability flag |
| `is_contributor` | INTEGER | DEFAULT 0 | Contributor flag |
| `nin` | TEXT | — | National ID number (encrypted) |
| `verified_provider` | INTEGER | DEFAULT 0 | KYC verification flag |
| `provider_type` | TEXT | NOT NULL, DEFAULT 'human' | 'human' or 'bot' |
| `livecast_signals_remaining` | INTEGER | DEFAULT 30 | Live streaming credits |
| `trust_score` | REAL | DEFAULT 5.0 | Reputation score (0-5) |
| `phone_verified_at` | TEXT | — | Phone verification timestamp |
| `email_verified_at` | TEXT | — | Email verification timestamp |
| `last_active_at` | TEXT | — | Last activity timestamp |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Created timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Updated timestamp |

### 2.2 `messages`
Chat message persistence.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Message ID |
| `phone` | TEXT | — | Sender/receiver phone |
| `sender` | TEXT | — | 'user', 'assistant', 'system' |
| `content` | TEXT | — | Message content |
| `channel` | TEXT | DEFAULT 'pwa' | Channel: pwa, whatsapp, telegram, sms |
| `card_data` | TEXT | — | JSON-encoded card data |
| `status` | TEXT | DEFAULT 'sent' | 'sent', 'delivered', 'read' |
| `whatsapp_msg_id` | TEXT | — | WhatsApp message ID |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.3 `economic_offers`
Provider offers for Economic Requests.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID |
| `request_id` | TEXT | NOT NULL, UNIQUE | FK to economic_requests |
| `seller_phone` | TEXT | NOT NULL | Provider phone |
| `description` | TEXT | NOT NULL | Offer description |
| `price_minor` | INTEGER | — | Price in minor currency units |
| `currency` | TEXT | NOT NULL, DEFAULT 'NGN' | Currency |
| `source` | TEXT | NOT NULL | Offer source ('conversationally_created', etc.) |
| `availability_note` | TEXT | — | Availability info |
| `external_source` | TEXT | — | External platform source |
| `status` | TEXT | DEFAULT 'available' | 'available', 'accepted', 'declined', 'withdrawn' |
| `provenance` | TEXT | DEFAULT 'conversationally_created' | Source of offer |
| `media_reference` | TEXT | — | Media reference |
| `external_url` | TEXT | — | External URL |
| `origin_offer_id` | TEXT | — | External offer ID |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.4 `economic_participants`
Lifecycle participants in an Economic Request.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Participant ID |
| `request_id` | TEXT | NOT NULL | FK to economic_requests |
| `role` | TEXT | NOT NULL, CHECK('seller','delivery_provider','service_provider','external_platform','agent') | Participant role |
| `provider_phone` | TEXT | NOT NULL | Provider phone number |
| `capability` | TEXT | NOT NULL | Capability name |
| `status` | TEXT | NOT NULL, DEFAULT 'invited', CHECK('invited','offered','selected','confirmed','handover_pending','handed_over','collected','in_progress','completion_reported','delivered','declined','withdrawn') | Lifecycle status |
| `evidence_json` | TEXT | NOT NULL, DEFAULT '{}' | JSON evidence |
| `added_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

**Note:** The `completion_reported` status allows providers to report completion before owner confirmation. The migration from older schemas preserves all rows.

### 2.5 `execution_requests`
Policy-gated external execution connector records.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Execution request ID |
| `request_id` | TEXT | NOT NULL | FK to economic_requests |
| `action_id` | TEXT | NOT NULL | Action identifier |
| `provider_phone` | TEXT | NOT NULL | Provider phone |
| `role` | TEXT | NOT NULL, CHECK(...) | Same roles as economic_participants |
| `capability` | TEXT | NOT NULL | Capability name |
| `action_requested` | TEXT | NOT NULL | Action description |
| `idempotency_key` | TEXT | NOT NULL, UNIQUE | Idempotency key |
| `correlation_id` | TEXT | NOT NULL | Correlation ID |
| `connector_id` | TEXT | NOT NULL | Connector identifier |
| `authorization_context` | TEXT | DEFAULT '{}' | JSON auth context |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK('pending','dispatched','acknowledged','in_progress','succeeded','failed','cancelled','expired') | Execution status |
| `external_reference` | TEXT | — | External reference |
| `failure_reason` | TEXT | — | Failure reason |
| `evidence_json` | TEXT | DEFAULT '[]' | JSON evidence array |
| `requested_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.6 `escrow`
Escrow records for payment protection.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Escrow record ID |
| `order_id` | TEXT | NOT NULL | Order reference |
| `buyer_phone` | TEXT | NOT NULL | Buyer phone |
| `provider_phone` | TEXT | NOT NULL | Provider phone |
| `amount_minor` | INTEGER | NOT NULL | Amount in minor currency units |
| `description` | TEXT | NOT NULL | Description |
| `status` | TEXT | DEFAULT 'held' | 'held', 'released', 'refunded', 'disputed' |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.7 `disputes`
Dispute records for orders.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Dispute ID |
| `phone` | TEXT | NOT NULL | User phone |
| `order_id` | TEXT | NOT NULL | Order reference |
| `reason` | TEXT | NOT NULL | Dispute reason |
| `status` | TEXT | DEFAULT 'open' | 'open', 'resolved', 'closed' |
| `resolution` | TEXT | — | Resolution text |
| `type` | TEXT | DEFAULT 'dispute' | Dispute type |
| `fault_party` | TEXT | — | Fault party |
| `fault_phone` | TEXT | — | Fault party phone |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.8 `skills`
Provider skill/service registrations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Skill ID |
| `phone` | TEXT | — | Provider phone (FK to memory_profiles) |
| `skill` | TEXT | NOT NULL | Skill/ capability name |
| `source` | TEXT | DEFAULT 'explicit' | Source of skill |
| `confidence` | REAL | DEFAULT 1.0 | Confidence score |
| `is_available` | INTEGER | DEFAULT 1 | Availability flag |
| `operation_mode` | TEXT | DEFAULT 'stationary' | 'stationary' or 'mobile' |
| `hourly_rate` | REAL | DEFAULT 0 | Hourly rate (currency units) |
| `rating` | REAL | DEFAULT 5.0 | Provider rating |
| `jobs_completed` | INTEGER | DEFAULT 0 | Completed jobs count |
| `equipment` | TEXT | — | JSON equipment list |
| `availability_schedule` | TEXT | — | JSON schedule |
| `service_radius_km` | REAL | DEFAULT 10 | Service radius |
| `transport_mode` | TEXT | — | Transport mode |
| `pricing_model` | TEXT | — | Pricing model |
| `execution_profile_json` | TEXT | NOT NULL, DEFAULT '{}' | Execution profile |
| `payment_method` | TEXT | — | Payment method |
| `booking_mode` | TEXT | DEFAULT 'instant' | 'instant' or 'request' |
| `products` | TEXT | — | JSON product list |
| `verified_artist` | INTEGER | DEFAULT 0 | Verified artist flag |

### 2.9 `skill_flows`
Skill flow definitions (questions, payment model, fulfillment).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `skill` | TEXT | PRIMARY KEY | Skill name |
| `question_set` | TEXT | — | JSON question set |
| `post_match_action` | TEXT | — | Action after match |
| `payment_model` | TEXT | — | 'lead', 'quote', 'payment', 'escrow', 'none' |
| `fulfillment_instructions` | TEXT | — | Fulfillment instructions |
| `available_locales` | TEXT | DEFAULT '["en"]' | JSON locale array |
| `booking_mode` | TEXT | DEFAULT 'instant' | Booking mode |
| `flow_mode` | TEXT | DEFAULT 'economic' | Flow mode |

### 2.10 `topics`
Community topics (forum-style).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Topic ID |
| `slug` | TEXT | NOT NULL, UNIQUE | URL slug |
| `author_phone` | TEXT | NOT NULL | Author phone |
| `title` | TEXT | NOT NULL | Topic title |
| `body` | TEXT | NOT NULL | Topic body |
| `type` | TEXT | NOT NULL | Topic type |
| `category` | TEXT | — | Category |
| `skills_json` | TEXT | NOT NULL, DEFAULT '[]' | JSON skill array |
| `city` | TEXT | — | City |
| `lga` | TEXT | — | LGA |
| `status` | TEXT | DEFAULT 'submitted', CHECK('draft','submitted','public','restricted','removed') | Publication status |
| `moderation_note` | TEXT | — | Moderator note |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `published_at` | TEXT | — | Publication timestamp |

### 2.11 `micro_tasks`
Micro-task assignments.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Task ID |
| `description` | TEXT | NOT NULL | Task description |
| `assigned_to` | TEXT | — | Assigned provider phone |
| `price_minor` | INTEGER | — | Price in minor units |
| `currency` | TEXT | DEFAULT 'NGN' | Currency |
| `status` | TEXT | DEFAULT 'open', CHECK(...) | Task status |
| `requested_by` | TEXT | — | Requester phone |
| `created_at` | TEXT | — | Creation timestamp |
| `updated_at` | TEXT | — | Update timestamp |
| `source_type` | TEXT | — | Source type |
| `source_id` | TEXT | — | Source ID |
| `verification_kind` | TEXT | — | Verification kind |
| `submitted_result` | TEXT | — | Submitted result |
| `moderation_note` | TEXT | — | Moderator note |
| `approved_by` | TEXT | — | Approver phone |
| `approved_at` | TEXT | — | Approval timestamp |

### 2.12 `content`
Static content (pages, articles, help).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `slug` | TEXT | PRIMARY KEY | Content slug/URL |
| `title` | TEXT | — | Page title |
| `body` | TEXT | — | Content body (HTML/Markdown) |
| `type` | TEXT | — | Content type |
| `author` | TEXT | — | Author |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.13 `credit_transactions`
Points/credit transaction history.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Transaction ID |
| `phone` | TEXT | NOT NULL | User phone |
| `amount` | INTEGER | NOT NULL | Amount (positive=credit, negative=debit) |
| `type` | TEXT | NOT NULL | Transaction type |
| `description` | TEXT | — | Description |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.14 `web_artifacts`
Voice notes, images, and media artifacts.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Artifact ID |
| `phone` | TEXT | NOT NULL | Owner phone |
| `kind` | TEXT | NOT NULL, DEFAULT 'voice-note' | Artifact kind |
| `title` | TEXT | NOT NULL, DEFAULT 'Untitled artifact' | Title |
| `storage_provider` | TEXT | NOT NULL, DEFAULT 'unknown' | Storage provider |
| `storage_status` | TEXT | NOT NULL, DEFAULT 'needs-review' | Storage status |
| `storage_url` | TEXT | — | Storage URL |
| `mime_type` | TEXT | — | MIME type |
| `duration_ms` | INTEGER | — | Duration in milliseconds |
| `transcript` | TEXT | — | Transcript text |
| `transcript_state` | TEXT | DEFAULT 'needs-review' | Transcript state |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.15 `connections`
External resource connections (Google Drive, Notion, etc.).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Connection ID |
| `owner_phone` | TEXT | NOT NULL | Owner phone |
| `source` | TEXT | NOT NULL | 'google_drive', 'google_sheets', 'notion', etc. |
| `access_token` | TEXT | — | Encrypted access token |
| `refresh_token` | TEXT | — | Encrypted refresh token |
| `expires_at` | TEXT | — | Token expiry |
| `scope` | TEXT | — | OAuth scope |
| `connected_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Connection timestamp |
| `last_sync_at` | TEXT | — | Last sync |

### 2.16 `notifications`
Notification queue.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Notification ID |
| `phone` | TEXT | NOT NULL | Recipient phone |
| `type` | TEXT | NOT NULL | Notification type |
| `title` | TEXT | NOT NULL | Title |
| `body` | TEXT | NOT NULL | Body |
| `data` | TEXT | — | JSON data |
| `read` | INTEGER | DEFAULT 0 | Read flag |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.17 `provider_presence`
Provider live presence status.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `phone` | TEXT | PRIMARY KEY, FK(memory_profiles) | Provider phone |
| `is_live` | INTEGER | DEFAULT 0 | Live status |
| `operation_mode` | TEXT | DEFAULT 'stationary' | 'stationary' or 'mobile' |
| `last_lat` | REAL | — | Last latitude |
| `last_lng` | REAL | — | Last longitude |
| `fuzzed_radius_m` | INTEGER | DEFAULT 100 | Fuzzed radius meters |
| `live_until` | TEXT | — | Live until timestamp |
| `last_confirmed` | TEXT | — | Last confirmed |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2.18 `provider_communication_sessions`
Provider-customer communication sessions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Session ID |
| `customer_phone` | TEXT | NOT NULL | Customer phone |
| `provider_phone` | TEXT | NOT NULL | Provider phone |
| `request_id` | TEXT | — | Associated request |
| `status` | TEXT | DEFAULT 'pending' | Session status |
| `room_id` | TEXT | — | WebRTC room ID |
| `proxy_phone` | TEXT | — | Masked phone number |
| `mode` | TEXT | DEFAULT 'text' | Communication mode |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| `ended_at` | TEXT | — | End timestamp |

### 2.19 `system_settings`
Key-value system configuration.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `key` | TEXT | PRIMARY KEY | Setting key |
| `value` | TEXT | — | Setting value (JSON-encoded) |

---

## 3. Economic Request Lifecycle

### States
```
requested → awaiting_match → partially_matched → matched
    → quoting → quoted → awaiting_confirmation → reserved
    → payment_pending → paid → in_fulfillment → fulfilled
    → completed → cancelled → disputed
```

### Participant Lifecycle
```
invited → offered → selected → confirmed
    → handover_pending → handed_over → collected
    → in_progress → completion_reported → delivered
    → declined → withdrawn
```

### Execution Request States
```
pending → dispatched → acknowledged → in_progress
    → succeeded / failed → cancelled / expired
```

---

## 4. API Contract Patterns

### 4.1 Authentication
- All authenticated routes use `authenticateUser` middleware.
- Token provided via HttpOnly cookie or `Authorization: Bearer <token>` header.
- Admin routes use `authenticateAdmin` middleware.

### 4.2 Response Format (Success)
```json
{ "success": true, "data": { ... } }
```

### 4.3 Response Format (Error)
```json
{ "success": false, "error": "Description of error" }
```

### 4.4 Pagination
All list endpoints accept:
- `limit` — page size (max 20)
- `before_id` / `offset` — pagination cursor

### 4.5 Key Endpoints

#### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | Public | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Public | Verify OTP, return JWT |
| POST | `/api/auth/logout` | Auth | Clear session |

#### Chat
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/chat/stream` | Optional | Streaming chat response |
| POST | `/api/chat/conversation` | Optional | Create conversation |
| GET | `/api/chat/history` | Optional | Get chat history |

#### Economic Requests
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/requests` | Auth | Create Economic Request |
| GET | `/api/requests/:id` | Owner | Get request details |
| POST | `/api/requests/:id/offer` | Auth | Submit offer |
| POST | `/api/requests/:id/pay` | Owner | Authorize payment |

#### Payments
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/intent` | Auth | Create payment intent |
| POST | `/api/payments/webhook` | Public | Webhook handler |

**Note:** Monetary values are stored in **pence** (integers), never floats. Commission calculation uses pence; minimum commission (£2.00) is waived for the first 90 days after launch.

---

## 5. External Integration Readiness

The following integrations have repository-ready boundaries but require external activation:

| Integration | Env Var | Category | Status |
|---|---|---|---|
| WhatsApp | `WHATSAPP_TOKEN` | Channels | PROVIDER_DEPENDENT |
| Telegram | `KURUKOO_TELEGRAM_*` | Channels | PROVIDER_DEPENDENT |
| SMS | `AFRICASTALKING_API_KEY` | Channels | PROVIDER_DEPENDENT |
| Email | `RESEND_API_KEY` | Channels | PROVIDER_DEPENDENT |
| FCM | `FIREBASE_*` | Channels | PROVIDER_DEPENDENT |
| Stripe | `STRIPE_SECRET_KEY` | Payments | PROVIDER_DEPENDENT |
| Mobile Money | `MOMO_API_KEY` | Payments | PROVIDER_DEPENDENT |
| WebSocket | `MQTT_BROKER_URL` | Infrastructure | PROVIDER_DEPENDENT |
| Voice | `KURUKOO_VOICE_*` | Voice | PROVIDER_DEPENDENT |
| WebRTC | `FF_WEBRTC` | Infrastructure | PROVIDER_DEPENDENT |

All adapters fail closed when credentials are absent. No provider is ever marked as "live" based on configuration alone.

---

## 6. Validation Rules

1. **Server-side validation is mandatory** — client validation is convenience only.
2. **Monetary values** are always integers in minor currency units (pence/kobo).
3. **Pagination** on all list queries (max 20 items per page).
4. **File uploads** — verify magic bytes server-side; accept only jpeg, png, webp; max 5MB.
5. **Real-time listeners** limited to messages (by threadId) and single bookings document.
6. **High-frequency reads** use `cacheGet()` with appropriate TTLs.
