# WHATSAPP CONTINGENCY PLAN

## Trigger Levels & Migration Actions

### Level 1: Moderate Cost Increase (2x - 5x)
- **Condition:** WhatsApp Business API per-message costs increase by 2 to 5 times.
- **Migration Action:** 
  - Subsidize core user interactions.
  - Limit automated daily nudges and marketing broadcasts over WhatsApp.
  - Implement a gentle prompt encouraging users to use the PWA for rich media and discovery.
  
### Level 2: Severe Cost Increase (10x)
- **Condition:** WhatsApp Business API costs become prohibitive for the Points economy.
- **Migration Action:**
  - Transition WhatsApp channel to an "Alerts Only" medium.
  - Send transactional links that open directly into the PWA.
  - Suspend all chatbot-based free browsing over WhatsApp.

### Level 3: API Revoked / Discontinued
- **Condition:** Meta revokes the API or shuts down the WhatsApp Business API.
- **Migration Action:**
  - Fallback to SMS / USSD (via Africa's Talking) for critical notifications.
  - Mandatory migration to the PWA and native app versions.
  - All support handles moved to in-app chat.

## PWA Migration Incentive Structure
- **Sign-in Bonus:** Users who install the PWA to their home screen receive a 500 Points bonus.
- **Discounted Leads:** Providers operating exclusively through the PWA receive a 20% discount on lead charges.
- **Exclusive Content:** Daily Picks and rich media discovery are only available in the PWA.

## Cost Model (Revised Numbers)
- **Current WhatsApp Cost:** ~₦5 per conversation.
- **Level 1 Cost (Projected):** ~₦25 per conversation (Absorption strategy: increase provider tier prices).
- **Level 2 Cost (Projected):** ~₦50 per conversation (Unbearable for gig economy; shift to PWA push notifications which cost ₦0 via FCM).
- **USSD/SMS Fallback:** ~₦4 per session, used strictly for fallback authentication.

## The FCM Push "Loophole" (Zero-Cost 24-Hour Session Reset)
To bypass Meta's 24-hour conversation window charges for smartphone-based WhatsApp channels, Kurukoo implements an automated **FCM Push Keep-Alive Loophole System**.

### 1. The Core Mechanism
When a message exchange occurs via WhatsApp, Meta starts a 24-hour window clock. Outbound business-initiated template messages outside this window carry significant premium per-conversation charges. To reset this clock for free:
- ** Standby Monitor (Hour 15):** The backend monitors active WhatsApp conversation sessions. At Hour 15 of idle time, a countdown triggers.
- **FCM Push Dispatch (Hour 22):** If 22 hours pass without a user message, Kurukoo's backend dispatches a free native FCM Push or PWA in-app notification: *"Your nearby live radar feed is updating! Tap here to see who is active near you right now."*
- **User-Initiated Tap & Send:** Tapping the notification deep-links the user directly back into WhatsApp with a pre-filled, high-intent action text: `Show nearby active providers`.
- **Clock Reset:** The moment the user hits send, Meta registers it as a *User-Initiated Conversation*. This restarts the 24-hour clock completely free, incurring zero platform or template charges.

### 2. Webhook Interceptor (`/api/onboard/keep-alive-reset`)
Incoming messages carrying the pre-filled keep-alive text trigger a backend webhook route that instantly intercepts the text, updates the user's `preferences.whatsapp_session_state` to `active_free` in their memory profile, logs the action under `profile_access_log` as `WEBHOOK_INTERCEPTED_SESSION_CLOCK_RESET`, and returns a customized live radar payload without incurring any Meta conversation setup fees.

### 3. Interactive Loophole Simulator
To demonstrate and test this pattern, a fully functional **Keep-Alive Loophole Simulator** has been integrated into the PWA user dashboard:
- **Session Age Controls:** Adjust session age incrementally to observe standby states, Hour 22 push triggers, and Hour 24 expirations.
- **Sliding Alert Banner:** Slides down mimicking a native mobile push alert.
- **Simulated WhatsApp Interface:** Opens a mock client with pre-filled inputs, trigger buttons, and immediate response rendering linked directly to the live SQLite `/api/onboard/keep-alive-reset` backend.

> **Note:** WhatsApp is a smartphone-friendly channel; the PWA App is the rich primary interface. Points are closed-loop loyalty tokens (see `POINTS_COMPLIANCE.md`) — they are never cashed out or converted to airtime by users.
