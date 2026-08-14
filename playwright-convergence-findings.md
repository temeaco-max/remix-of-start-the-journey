# Whole-product convergence findings

## 2026-08-14

The live `/chat/` shell loaded with the existing left navigation, dominant center conversation area, and right contextual inspector. The new accessible **Show notifications** control opened the existing authenticated internal notification authority inside the inspector. With no queued notifications, the UI truthfully rendered “Your internal Kurukoo inbox is up to date” and “No notifications yet.” The desktop header and 390px mobile shell both exposed the notification and conversation-context controls.

At 390px, the sidebar correctly collapses to an off-canvas overlay and reopens through the **Open sidebar** control. The context inspector correctly captures pointer events while open, so the sidebar cannot be opened through the obscured header until the inspector is closed; this is expected overlay behavior, not a data defect. The browser initially returned a stale accessibility reference for the already-closed sidebar close control; DOM geometry confirmed the sidebar was translated off-screen, and the normal open/close path then worked.

A read-only browser sweep found the public/workspace pages generally returned 200/304 and rendered a main surface. `/channels` returned HTTP 500 because `views/channels.ejs` referenced `channelStatuses` through a template declaration that was not safely guarded in the production render context. The source was repaired to defensively alias only an object value, the production build was regenerated, and `/channels` now returns HTTP 200 with the expected “One Kurukoo relationship, different access points” content. `npm run test:public-runtime` passed afterward.

The AI baseline exposed a real-model misclassification for “What should I know before using Kurukoo?” as `order_food`; explicit `general_question` examples and a smoke-test assertion were added. The next FastText regression exposed “Help me find a football match this weekend” as `find_worker`; explicit `sports_matchmaking` examples were added. The rebuilt real model now reports `source=fasttext` and passes all 6/6 FastText model-routing checks, with 165 training examples and 12 labels.

The current environment exposes only OpenAI proxy variables to the sandbox. The pasted Groq, Hugging Face, Stripe, Firebase, and other credentials were not copied into source, logs, or repository configuration. Existing tests continue to report Stripe as sandbox and FCM as internal queued delivery when external adapters are not configured.

## Advertising convergence

The public `/advertise/` page was exercised at mobile width. It clearly disclosed that self-service advertising was not available in the current deployment and linked to Web Chat for a proposed placement, without claiming external advertiser activation.

A real implementation defect was found: the existing admin dashboard had a functional-looking “Launch Campaign” form posting to `/api/ads`, but the backend only exposed `GET /api/ads`. A validated authenticated `POST /api/ads` endpoint was added and wired to the existing `createAdCampaign` authority. The ad manager now migrates and backfills demo metadata, including `campaignType=demo_internal`, `disclosure`, `placement`, category/geography fields, frequency cap, and impression/click counters. Seed campaigns are explicitly marked as Kurukoo demo advertisements, and public Daily Picks projections include the disclosure text.

A more serious privacy defect was found in the canonical intent router: private Chat text was keyword-matched against ad campaigns and attached as a sponsored payload. That path was removed. A targeted `npm run test:private-chat-ad-boundary` regression now proves private conversation messages never receive sponsored payloads. Public ad matching remains available through the ad manager and public opportunity authority, and `npm run test:advertising` verifies demo seeding, campaign creation, metadata, and public matching.

## Commercial and growth convergence

The phase-five actor baseline passed circles, agent runtime, economic lifecycle, provider entities, multi-party coordination, notification queue, presence, and network-to-Chat convergence.

A service defect was found in referral attribution: `trackReferral` relied on `INSERT OR IGNORE` without a uniqueness constraint, allowing duplicate registrations; it also did not protect all non-HTTP call paths from self-referral or mismatched code ownership. The service now validates code ownership, rejects self-referral, and checks existing referred actors before insertion. A second defect was found in `claimReferral`: the prepared statement was read without calling `step()`, so qualifying referrals could never be claimed. Both defects were repaired. `npm run test:referral` and `npm run test:qr` now pass with valid two-actor attribution, duplicate suppression, exactly-once reward, and QR continuation.

New first-class regressions now exist for subscriptions, Points, and top-ups. Subscription checks prove payment-required failure, explicit QA-only sandbox grant, and persisted customer tier. Points checks prove owner-scoped award/spend history, distinct loyalty units, and UK disablement. Top-up checks prove sandbox Points increment, fail-closed wallet movement, and unchanged fiat wallet balance. No live payment settlement is claimed.

## Final public UI sweep

The first sweep was performed against a stale production process and reported `/topics` as a 404 even though the current source route existed. After rebuilding and restarting the latest production server on port 3100, `/topics` returned 200 in the live browser. Its accessibility tree exposed the community-context safety disclosure, “Ask Kurukoo first” and “Share a Topic” actions, category/type filters, and moderated publishing language. The live route was therefore a stale-process observation, not a source defect.

## Daily Picks disclosure review

The deployed public route sweep was reviewed against the latest local production build. `/discover` returned 304 and rendered the Nearby Pulse surface; `/advertise` returned 304 and disclosed that self-service advertising is unavailable in this deployment. The authenticated `/daily-picks` workspace was entered through the controlled development-auth flow using the synthetic configured test actor.

Daily Picks rendered both the hero text “clearly labelled promotions” and the recommendation disclosure “Sponsored content is always labelled.” Its sponsored panel was visibly labelled “Sponsored,” described itself as a controlled advertisement slot, and showed “No active promotion.” A second sponsored preview card stated “Sponsored,” “Advertisement placement preview,” and “Sponsored content will never interrupt an active conversation.” No unlabelled campaign appeared. The current sandbox therefore has the disclosure implementation visible and truthful, while no active campaign is being claimed.
