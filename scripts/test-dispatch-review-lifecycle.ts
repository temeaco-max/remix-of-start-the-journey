import assert from 'node:assert/strict';
import { getDb, saveDb } from '../src/database.js';
import { createEconomicRequest } from '../src/services/skillFlows.js';
import { ensureTrustScoreSchema } from '../src/services/trustScore.js';
import { createServiceReview } from '../src/services/serviceReviewService.js';

const suffix = Date.now().toString();
const customer = `review_customer_${suffix}`;
const provider = `review_provider_${suffix}`;
const requestId = `review_request_${suffix}`;
const leadId = `review_lead_${suffix}`;
const db = await getDb();
try {
  db.run(`INSERT OR IGNORE INTO memory_profiles (phone,name,country,verified_provider,created_at,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, [customer,'Review Customer','ng',0]);
  db.run(`INSERT OR IGNORE INTO memory_profiles (phone,name,country,verified_provider,created_at,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, [provider,'Review Provider','ng',1]);
  db.run(`INSERT OR IGNORE INTO skills (phone,skill,is_available,jobs_completed,rating) VALUES (?,?,?,?,?)`, [provider,'okada_rider',1,0,3]);
  await createEconomicRequest({ id: requestId, phone: customer, skill: 'okada_rider', requirements: { origin: 'Lagos', destination: 'Ikeja' }, status: 'completed' });
  db.run(`INSERT INTO economic_dispatch_leads (id,request_id,provider_phone,skill,status,lead_points,completed_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`, [leadId,requestId,provider,'okada_rider','completed',50]);
  await ensureTrustScoreSchema();
  const review = await createServiceReview({ requestId, reviewerPhone: customer, providerPhone: provider, rating: 5, feedback: 'Great ride.' });
  assert.equal(review.rating, 5);
  const skill = db.exec('SELECT rating,is_available,jobs_completed FROM skills WHERE phone=? AND skill=?', [provider,'okada_rider']);
  const row = skill[0]?.values?.[0] || [];
  assert.equal(Number(row[0]), 5);
  assert.equal(Number(row[1]), 1);
  console.log(JSON.stringify({ passed: true, reviewId: review.id, providerRating: Number(row[0]) }, null, 2));
} finally {
  db.run('DELETE FROM service_reviews WHERE request_id=?', [requestId]);
  db.run('DELETE FROM economic_dispatch_leads WHERE id=?', [leadId]);
  db.run('DELETE FROM orders WHERE id=?', [requestId]);
  db.run('DELETE FROM audit_logs WHERE details LIKE ?', [`%${requestId}%`]);
  db.run('DELETE FROM trust_score_ledger WHERE phone=?', [provider]);
  db.run('DELETE FROM credit_transactions WHERE phone=? AND description LIKE ?', [provider, `%${requestId}%`]);
  db.run('DELETE FROM memory_profiles WHERE phone IN (?,?)', [customer,provider]);
  db.run('DELETE FROM skills WHERE phone=?', [provider]);
  saveDb(true);
}
