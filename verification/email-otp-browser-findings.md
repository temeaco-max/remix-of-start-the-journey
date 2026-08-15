# Email OTP browser verification

On 2026-08-15, the local `/login` page returned HTTP 200 and rendered the existing name-first, phone-first authentication flow. After entering a test name and advancing, the page showed the phone input plus the visible `Use email for the code instead` action. Selecting it revealed `Email for verification`, retained the phone field, and changed the copy to explain that email carries the code while the phone remains the primary Kurukoo channel identity.

The local deployment has no Resend key/from configuration, so the real email send step remains expected to fail closed with a truthful provider-not-configured message. No external email delivery was claimed.
The email branch correctly refused submission until a valid phone number was entered. This confirms the intended phone-preserving behavior: email is an alternative delivery channel, not a replacement for the phone identity required by Kurukoo’s communications architecture.
With a valid test phone and email, the local browser request returned `Invalid or expired authentication token` instead of the expected provider-unconfigured email OTP response. This indicates a route/middleware or stale-cookie integration defect that must be fixed before declaring the browser flow complete.
