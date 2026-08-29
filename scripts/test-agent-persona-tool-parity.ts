/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-agent-persona-parity-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch { /* isolated test path */ }
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;

const { getAllAIAgents } = await import('../src/services/aiAgentService.js');
const { listAgentTools } = await import('../src/services/agentToolRegistry.js');

const declared = new Set(listAgentTools().map(tool => tool.name));
const agents = await getAllAIAgents();
assert.ok(agents.length > 0, 'default agents should be seeded');
for (const agent of agents) {
  for (const tool of agent.tools) {
    assert.ok(declared.has(tool), `${agent.id} advertises an unregistered agent tool: ${tool}`);
  }
}

const source = fs.readFileSync(new URL('../src/services/aiAgentService.ts', import.meta.url), 'utf8');
for (const unsupported of ['catalog_scraper', 'market_database', 'lga_price_analyzer', 'human_escalation', 'database_write', 'trade_engine', 'pulse_matcher', 'escrow_service', 'content_cms']) {
  assert.equal(source.includes(`tools: ['${unsupported}`), false, `unsupported persona tool declaration remains: ${unsupported}`);
}

console.log(`Agent persona tool parity passed: ${agents.length} seeded personas advertise only ${declared.size} canonical agent tools.`);
try { fs.unlinkSync(dbPath); } catch { /* best effort cleanup */ }
