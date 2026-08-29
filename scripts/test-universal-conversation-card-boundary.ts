/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/services/canonicalChatTurnService.ts', import.meta.url), 'utf8');

assert.match(source, /function shouldUseUniversalConversationOwner\(routing: IntentRoutingResult\): boolean/);
assert.match(source, /if \(routing\.skill !== 'general_question'\) return false;/);
assert.match(source, /if \(routing\.canonicalAction\) return false;/);
assert.match(source, /if \(routing\.cardData && typeof routing\.cardData === 'object'\) return routing\.cardData\.type === 'ai_metadata';/);
assert.ok(!source.includes('economic_request|agentic_storefront|checkout|payment|reminder|notification|safety|provider_profile|seller_offer|topic_draft|events_list|sports_search'), 'old partial-card exclusion policy should be removed in favour of generic native-card preservation');

console.log('Universal conversation/native-card boundary passed: structured capability cards remain owned by their canonical surfaces.');
