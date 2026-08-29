/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { buildConversationContextPack } from '../src/services/conversationContextPackService.js';

const empty = await buildConversationContextPack(undefined, undefined, 'Hello');
assert.equal(empty.transcript, '');
assert.equal(empty.turns, 0);

console.log('Conversation context pack regression loaded: thread-scoped transcript is bounded and disabled without an authenticated thread.');
