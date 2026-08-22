# Authenticated Advertising Parity

## Purpose

Kurukoo already has a canonical advertising system used by Chat, Daily Picks, Explore and other public/discovery surfaces. The authenticated Web/PWA shell must not silently omit that monetisation surface when Desk and Chat are sharing the same operating environment.

## Placement model

The authenticated left-rail sponsored card is **content, not navigation**.

It belongs below the primary/secondary navigation and above the account/lower rail where the shell has sufficient vertical space. It must never consume a sidebar navigation slot, resemble a normal Kurukoo destination, or displace core work.

The canonical placement token is:

`authenticated_left_rail`

The backend owner is the existing `adManager` authority. The browser surface is:

`GET /api/advertising/left-rail`

Click-through uses the existing:

`/ads/:id/click`

tracking boundary.

## Truth requirements

A sponsored card renders only when:

- the campaign is active;
- its placement is eligible for the current surface;
- its schedule is active;
- its asset is approved and renderable;
- disclosure is present;
- destination/CTA are provided by the campaign authority.

When no campaign is eligible, the placement disappears without leaving an empty shell gap.

Development visual QA has a deterministic fixture; production does not seed demo advertising and must use Admin-managed campaigns.

## Chat/Desk parity

Chat already defines sponsored cards in its left rail and promotion/Daily Picks in the contextual/right-side areas. Desk must carry the **same monetisation meaning and campaign authority**, while retaining its own content composition.

The Desk Personal Workspace reference does not require the ad card itself to be copied pixel-for-pixel. The reference defines the Desk content composition; the advertising component is a reusable Kurukoo OS component styled consistently with the authenticated shell.

## Visual rules for Manus

- Preserve clear `Sponsored`/campaign disclosure.
- Keep the card compact enough that it does not compete with primary navigation.
- Use the shared Kurukoo OS card/component tokens.
- Use canonical logo/icon/brand primitives rather than campaign-specific brand geometry for the shell.
- Do not hardcode an ad into the HTML template.
- Do not fabricate an unavailable campaign.
- Do not turn Ads into a sidebar link.
- On narrow/mobile navigation, hide the left-rail placement rather than forcing it into bottom navigation.
- Web App first: visually validate the placement in the shared Desk/Chat shell before adapting it to PWA/native layouts.
