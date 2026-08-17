import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/database.js';
import { ensureCurationSchema } from '../src/services/curationService.js';

await ensureCurationSchema();
const db = await getDb();
const columns = db.exec('PRAGMA table_info(training_curation_candidates)')[0]?.values?.map((row: any[]) => String(row[1])) || [];
const rows = db.exec('SELECT * FROM training_curation_candidates WHERE reviewed=1 AND accepted=1 ORDER BY example_id')[0]?.values || [];
const output = rows.map((values: any[]) => {
  const row = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  const source = JSON.parse(String(row.trajectory_json || '{}'));
  const messages = Array.isArray(source) ? source : (Array.isArray(source.messages) ? source.messages : []);
  return {
    exampleId: row.example_id,
    scenarioId: row.scenario_id,
    messages,
    skill: row.skill,
    family: row.family,
    actor: row.actor,
    market: row.market,
    locale: row.locale,
    channel: row.channel,
    lifecycle: row.lifecycle,
    scenarioVariant: row.scenario_variant,
    provenance: { ...(JSON.parse(String(row.provenance_json || '{}'))), source: 'admin-curation-accepted', reviewed: true, accepted: true, productionUserData: false, mutatesCanonicalState: false },
    quality: { reviewed: true, accepted: true, scores: JSON.parse(String(row.review_scores_json || '{}')), reviewStatus: row.review_status, reviewerId: row.reviewer_id, candidateVersion: row.version },
  };
});
const target = path.join(process.cwd(), 'ml', 'datasets', 'kurukoo-curated-accepted.jsonl');
fs.writeFileSync(target, output.map(row => JSON.stringify(row)).join('\n') + (output.length ? '\n' : ''), 'utf8');
console.log(JSON.stringify({ output: target, acceptedRows: output.length, explicitOnly: true, trainingStarted: false }, null, 2));
