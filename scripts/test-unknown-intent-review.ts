import { strict as assert } from 'node:assert';
import { getDb } from '../src/database.js';
import { recordUnknownIntentCandidate, listUnknownIntentReviewCandidates, reviewUnknownIntentCandidate } from '../src/services/unknownIntentReviewService.js';

const query = `synthetic review candidate ${Date.now()}`;
await recordUnknownIntentCandidate(query);
const rows = await listUnknownIntentReviewCandidates('pending', 250);
const candidate = rows.find(row => row.candidate_text === query);
assert.ok(candidate, 'unknown-intent candidate was not queued');
assert.equal(candidate.status, 'pending');

const accepted = await reviewUnknownIntentCandidate(candidate.id, 'ci-reviewer', 'accepted', 'general', 'find_worker', query, 'synthetic CI acceptance');
assert.equal(accepted, true);
const acceptedRows = await listUnknownIntentReviewCandidates('accepted', 250);
const acceptedCandidate = acceptedRows.find(row => row.id === candidate.id);
assert.ok(acceptedCandidate, 'accepted review candidate was not persisted');
assert.equal(acceptedCandidate.reviewer_id, 'ci-reviewer');
assert.equal(acceptedCandidate.accepted_training_example, query);

const db = await getDb();
const check = db.prepare('SELECT status FROM unknown_intent_review_queue WHERE id=? LIMIT 1');
check.bind([candidate.id]);
assert.equal(check.step(), true);
check.free();

console.log(JSON.stringify({ passed: true, candidateId: candidate.id }, null, 2));
