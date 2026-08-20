import assert from 'node:assert/strict';
import { getDb, saveDb } from '../src/database.js';
import { registerNetworkAgent, getNetworkAgentByPhone, getProviderLeadCost, chargeProviderLead } from '../src/services/agentNetworkCommerce.js';

const phone = `ci_agent_${Date.now()}@example.com`;
const providerPhone = `ci_provider_${Date.now()}@example.com`;
const db = await getDb();
try {
  db.run(`INSERT INTO memory_profiles (phone,name,country,points_balance,grace_leads) VALUES (?,?,?,?,?)`, [providerPhone, 'CI Provider', 'ng', 200, 0]);
  const agent = await registerNetworkAgent({ phone, name: 'CI POS Agent', agentType: 'pos', country: 'ng', region: 'Ikeja', commissionBps: 250 });
  assert.equal(agent.agentType, 'pos');
  assert.equal(agent.canSellPoints, true);
  assert.equal((await getNetworkAgentByPhone(phone))?.id, agent.id);
  assert.ok((await getProviderLeadCost('okada')) >= 1);
  const charge = await chargeProviderLead({ providerPhone, category: 'okada', requestId: 'ci-request' });
  assert.equal(charge.success, true);
  assert.equal(charge.chargedPoints, 50);
  console.log(JSON.stringify({ passed: true, agentId: agent.id, leadCharge: charge.chargedPoints }, null, 2));
} finally {
  db.run('DELETE FROM kurukoo_network_agents WHERE phone=?', [phone]);
  db.run('DELETE FROM memory_profiles WHERE phone=?', [providerPhone]);
  saveDb(true);
}
