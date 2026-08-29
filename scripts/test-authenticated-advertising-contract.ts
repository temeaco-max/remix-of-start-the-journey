/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { AUTHENTICATED_AD_PLACEMENTS, AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD } from '../src/services/authenticatedAdvertisingFoundation';

assert.equal(AUTHENTICATED_AD_PLACEMENTS.leftRail, 'authenticated_left_rail');
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.role, 'monetisation-content');
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.adminManaged, true);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.approvedAssetRequired, true);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.disclosureRequired, true);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.userNavigationItem, false);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.optional, true);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.surfaceRules.some((rule) => /never occupy a navigation slot/i.test(rule)), true);
assert.equal(AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD.surfaceRules.some((rule) => /absent when no eligible campaign/i.test(rule)), true);

console.log('authenticated advertising contract: PASS');
