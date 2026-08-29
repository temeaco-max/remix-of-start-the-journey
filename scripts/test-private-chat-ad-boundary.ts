/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { routeIntent } from '../src/services/intentRouter.js';

const result = await routeIntent('Tell me about rice offers and local food options', '+2348030000000');
assert.ok(result.skill, 'the canonical router should still classify and answer the conversation');
assert.ok(!result.cardData?.sponsored, 'private Chat must not receive a sponsored payload based on message keywords');
console.log('Private Chat advertising boundary passed: conversational text is not used for hidden ad targeting.');
