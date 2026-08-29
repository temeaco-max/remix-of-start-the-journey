/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { getAssistanceOutcome } from '../src/services/assistanceOutcomeService.js';
import { routeIntent } from '../src/services/intentRouter.js';
import { saveContent, deleteContentBySlug } from '../src/services/contentManager.js';

const slug = 'test-iphone-repair-assistance';
await saveContent({
  slug,
  title: 'How to repair an iPhone charging problem',
  body: 'Check the cable, port and power source before seeking a qualified repairer.',
  type: 'help',
  author: 'test',
});
try {
  const projection = await getAssistanceOutcome('How do I repair my iPhone charging problem?');
  assert.ok(projection, 'content should produce an assistance projection');
  assert.equal(projection?.type, 'assistance_outcome');
  assert.equal(projection?.truth.sourceAttributed, true);
  assert.equal(projection?.truth.noProviderClaim, true);
  assert.equal(projection?.truth.noExecutionClaim, true);
  assert.ok(projection?.sources.some(source => source.id === slug));
  assert.ok(projection?.nextActions.some(action => action.id === 'find_verified_help'));

  const routed = await routeIntent('How do I repair my iPhone charging problem?');
  assert.equal(routed.cardData?.type, 'assistance_outcome');
  assert.equal(routed.canonicalAction, 'assistance.content.open');
  assert.equal(routed.extractionSource, 'deterministic');
  assert.match(routed.reply, /not treated any source as a provider/i);
  console.log('Assistance outcome convergence regression passed');
} finally {
  await deleteContentBySlug(slug);
}
