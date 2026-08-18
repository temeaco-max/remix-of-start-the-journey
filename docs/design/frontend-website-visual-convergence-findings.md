# Frontend Website Visual-Convergence Findings

The authoritative frontend website set is a compact 2x2 desktop screen set with a restrained 1440px canvas, thin navigation, small typography, low-contrast borders, and page-specific compositions.

The current live Channels page visibly diverges: it presents a large centered marketing hero, an extra Web Chat access-point section, and seven deployment-oriented adapter cards. The reference Channels screen instead presents a compact `Channels` heading, a five-card connected-source grid (Google Drive, Google Sheets, Notion, Microsoft Outlook and Microsoft OneDrive), followed by a single `Provider readiness` notice and a compact footer.

The current public header also diverges from the reference set in visible desktop density: the live page has a larger open content field and different navigation actions (`Sign in` and `Start chatting`) while the reference uses compact `Sign in` and `Get started` controls. The reference Homepage hero places the conversation preview as a taller, denser card with a source-list result and composer; the current implementation uses a simpler illustrative request card. The reference Discover page is closer structurally, but must be checked for exact card dimensions, typography, toolbar spacing, source icon scale and footer height. The reference About/Help composition is a single combined screen: About narrative and principles on the left, Help category list and support card on the right; separate full-width About and Help pages therefore require a deliberate responsive/page mapping decision rather than generic marketing layouts.

The next correction pass must prioritize exact page composition and density over adding explanatory copy, while retaining truthful readiness boundaries and canonical Chat/discovery behavior.

## Second-pass comparison

The shared public header is now materially closer to the reference: Explore, Channels, About and Help are visually compact, and the primary action reads `Get started`. Channels now matches the reference information architecture with five source cards and a provider-readiness notice; its remaining work is fine-grained scale and footer density.

The Homepage remains functionally richer than the compact reference screen. Its hero is visually close, but the embedded conversation preview is simpler than the reference: the reference contains a denser multi-message thread, source result list and composer controls. The current Homepage also continues into many product sections in the same long page, whereas the reference screen presents only the compact first-viewport composition. The next pass should preserve those existing sections below the fold while making the first viewport and footer treatment closer to the reference.

## Latest live verification

The Homepage source-list and composer now render compactly inside the hero card after the cache-key and specificity fixes. The card has the correct dense conversation rhythm, source rows and composer affordance without the previous oversized block.

About now matches the reference’s combined composition: the left column contains About Kurukoo and the three principles, while the right column contains Help categories and the support card. The existing Kurukoo relationship narrative remains below the reference first viewport rather than being removed.

## Footer convergence

The public footer is now scoped through `frontend-site-footer` and loads explicitly on the public website-set views. Channels verifies with the intended compact white footer, small link groups and thin copyright row instead of the previous dark workspace-style footer. The five-card Channels composition remains stable after the footer change.

## Multi-agent repository audit

The audit found one web repository at `/home/ubuntu/kurukoo-git`, one local worktree on `main`, and no separate active web clone or remote feature branches. `/home/ubuntu/kurukoo` and `/home/ubuntu/kurukoo-design` are non-git asset/design directories; `/home/ubuntu/kurukoo-mobile` is a separate Expo mobile repository. The canonical web branch currently contains the local visual commits beyond `origin/main`, so the apparent parallel work is represented in the shared commit history rather than in independently mergeable branches.

The relevant visual history contains two distinct directions. The earlier commits (`c242392`, `35cd1c1`, `1a96fb3`) preserve the richer Homepage, About, Help and Channels content model, including the reusable relationship, memory, request-state, provider, support-guide and common-question sections. The later website-set implementation (`99d5c4f`, `dbf5c87`) correctly moves the public first viewport toward the authoritative four-quadrant screen set, but its About and Help rewrites removed much of that reusable content, and the Homepage still renders many lower sections that push the reference footer far below the first composition.

The authoritative reference is therefore best satisfied by a hybrid convergence rather than another full rewrite. The first viewport and shell should follow the frontend website set exactly: compact header, four public compositions, five-card Channels grid, About-plus-Help split, source-card Discover layout and compact footer. The richer earlier content should be restored below those reference compositions or relocated into the appropriate public pages, reusing existing CSS authorities and canonical routes. It must not be duplicated in the Homepage first viewport, and it must not create parallel page or Chat architectures.

No implementation from another active repository should be blindly copied. The next action is to preserve the current reference-aligned first viewport, recover the valuable legacy sections into About, Help, Discover and Channels where semantically appropriate, remove duplicate Homepage lower sections only when their content has a clear destination, and then verify both the reference viewport and the relocated content.

## Hybrid live verification

The reconciled About page preserves the reference split first viewport and renders the restored relationship card plus orchestration/trust detail below it without duplicating the old full-page layout.

The reconciled Help page preserves the reference support hierarchy and truthful contact card. Its restored guides and common-question content is present, but the live comparison shows the lower guide section needs a final stylesheet-load/style pass so the restored cards and lists receive the intended compact public-page treatment rather than falling back to browser-default typography.

## Separate desktop authority comparison

The other agent’s live desktop project is materially stronger than the current main first viewport in visual fidelity. Its Homepage uses the reference’s warmer compact shell, a denser and more realistic conversation preview with user initials, source rows and composer controls, a restrained three-principle row, and a compact footer. Its Explore surface matches the reference Discover quadrant closely: the 178px-style filter rail, toolbar/search alignment, three-column source-card grid, avatars/source metadata, compact spacing and footer are all closer to the design image than the current main render.

This project is not yet a drop-in replacement: its route is `/explore` rather than the canonical main `/discover`, its controls are component-state driven rather than the server-rendered EJS contracts, and its footer/year/content vocabulary differs. It also reports only three contract tests, type-check and build; it explicitly documents authentication, OAuth, source synchronization and remaining routes as future work. The visual layer is therefore a strong candidate to port selectively, not an authority to replace canonical routing or backend ownership wholesale.

The separate desktop Channels surface is visually closer to the reference than current main: five compact cards, correct readiness notice, clear active navigation and a restrained footer. Its About surface is also visually disciplined and closer to the reference split than main’s current version, but it omits the Help half of the quadrant and the deeper relationship/continuation content. Its copy is strong for a design prototype but differs from canonical wording in places such as “Useful before technical,” “source links” and “secure,” which must be reconciled with approved product language and truth boundaries.

The separate desktop Help route is the closest match to the reference bottom-right quadrant: it combines the About trust surface on the left with the Help support surface on the right, uses the correct compact category rows and support card, and keeps the footer restrained. It does not include the richer guides, common questions, canonical readiness copy or server-owned route data that main already has.

### Decision recommendation

Adopt the separate desktop project as the visual benchmark and selectively port its shell geometry, typography scale, warm palette, conversation-preview treatment, Discover card density, Channels card proportions and About/Help split into canonical main. Do not replace main with the separate project and do not copy its route/state model. Preserve `/discover`, canonical Chat handoffs, server-provided source data, readiness boundaries, public SEO/runtime contracts and the restored reusable content. The separate project should remain a visual reference or be merged only through an explicit code handoff if its repository becomes available; its live preview alone is not sufficient evidence for a safe wholesale merge.


## Selective port verification — 18 August 2026

The second agent’s portable public authority stylesheet is now loaded only on the canonical public Homepage, Discover, Channels, About and Help routes. The live Homepage preserves Kurukoo’s canonical lower sections and truthful ads while receiving the stronger compact shell, warm palette, source-card scale and conversation-card rhythm. Discover retains the canonical source filters, cards and Nearby Pulse map handoff while receiving the compact Explore-style geometry. Channels renders the five connector cards and provider-readiness boundary at the reference density. About retains the reference split About-plus-Help first viewport and the restored relationship/orchestration detail below it.

The exact three-petal Kurukoo mark from the separate desktop implementation has replaced the legacy star icon in the public navigation, footer and Homepage illustrative previews. The wordmark and public route contracts remain unchanged. The separate develop branch was not wholesale merged because it includes unrelated static/admin/radar/chat changes and content contracts that require independent review.
