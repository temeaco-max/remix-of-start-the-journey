import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.DB_PATH = path.join(process.cwd(), 'data', 'scenario-lab', 'trajectory-harness.sqlite');
process.env.MEMORY_ENCRYPTION_KEY = 'trajectory-harness-test-key';
const scenarioPath = path.join(process.cwd(), 'data', 'scenario-lab', 'provider-outcome-scenarios.jsonl');
if (!fs.existsSync(scenarioPath)) throw new Error('Generate the scenario laboratory before running the trajectory harness.');
const rows = fs.readFileSync(scenarioPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
const { routeIntent } = await import('../src/services/intentRouter.js');
const selected = [5, 10, 20, 40, 80, 81].map((horizon) => rows.find((row) => row.horizon === horizon));
assert.equal(selected.filter(Boolean).length, 6, 'All long-horizon samples must be present.');
let turns = 0;
let failures = 0;
const results: any[] = [];
for (const [index, row] of selected.entries()) {
  const userTurns = row.trajectory.filter((message: any) => message.role === 'user');
  let rowFailures = 0;
  for (const [turnIndex, message] of userTurns.entries()) {
    try {
      const result = await routeIntent(message.content, `trajectory_harness_${index}`, undefined);
      assert.ok(result && typeof result.reply === 'string', 'Canonical route must return a bounded reply.');
      turns += 1;
    } catch (error) {
      rowFailures += 1;
      failures += 1;
      results.push({ scenarioId: row.scenarioId, horizon: row.horizon, turnIndex, error: error instanceof Error ? error.message : String(error) });
    }
  }
  results.push({ scenarioId: row.scenarioId, horizon: row.horizon, userTurns: userTurns.length, failures: rowFailures });
}
assert.equal(failures, 0, JSON.stringify(results));
console.log(JSON.stringify({ harness: 'canonical-long-horizon-trajectory-v1', scenarios: selected.length, turns, failures, horizons: selected.map((row) => row.horizon), mutationAuthority: 'canonical services only' }, null, 2));
