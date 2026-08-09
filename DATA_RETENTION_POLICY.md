# DATA RETENTION & PURGING POLICY

## 1. Overview
Kurukoo is committed to data minimization and privacy. We retain personal data only as long as necessary to provide our services, maintain security, and comply with legal obligations.

## 2. Retention Periods
- **Temporary Sessions:** Chat sessions initialized by anonymous users or incomplete onboarding flows are purged after **24 hours**.
- **Audit Logs:** System logs containing potentially sensitive operational data are purged after **30 days**.
- **Location Data:** If location history is enabled, data older than **30 days** is deleted. (By default, only current location is maintained for active providers).
- **Personal Profile Data:** Retained until the user requests deletion.

## 3. Account Deletion Process
Users can delete their account via the PWA Settings drawer ("Delete My Account"). 
When a deletion is requested:
- The user's `memory_profile` is hard-deleted.
- The user's `skills` and roles are hard-deleted.
- The user's `profile_access_log` entries are deleted.
- **Anonymization:** Transactional records (e.g., `orders`, `credit_transactions`) are retained for financial reconciliation and analytical purposes but are stripped of the user's phone number and personally identifiable information (replaced with `ANONYMOUS`).

## 4. Data Export
Users can download a complete copy of their data via the PWA Settings drawer ("Download Data"). This provides a JSON export containing:
- Profile information and preferences.
- Registered skills.
- Order history (as a buyer or provider).

## 5. Automated Purging
A daily cron job runs on the server to automatically purge expired temporary sessions and audit logs. This ensures compliance with our retention periods without manual intervention.
