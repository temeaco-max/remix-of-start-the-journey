import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.KURUKOO_MCP_ENABLED = 'true';
process.env.KURUKOO_MCP_ISSUER = 'https://kurukoo.test';
process.env.KURUKOO_MCP_CLIENT_ID = 'chatgpt-test-client';
process.env.KURUKOO_MCP_REDIRECT_URIS = 'https://chatgpt.test/oauth/callback';
process.env.JWT_SECRET = 'mcp-test-secret-012345678901234567890123456789';
process.env.KURUKOO_MCP_OAUTH_SECRET = process.env.JWT_SECRET;
process.env.DB_PATH = path.join(process.cwd(), 'tmp', `mcp-test-${process.pid}.sqlite`);

const {
  beginAuthorization,
  getAuthorizationTransaction,
  approveAuthorization,
  exchangeAuthorizationCode,
  verifyAccessToken,
  mcpEnabled,
  getMcpMetadata,
  getProtectedResourceMetadata,
  mcpToolList,
  callMcpTool,
} = await import('../src/services/mcpAppService.js');

assert.equal(mcpEnabled(), true);
assert.equal(getMcpMetadata().authorization_endpoint, 'https://kurukoo.test/oauth/authorize');
assert.equal(getProtectedResourceMetadata().resource, 'https://kurukoo.test/mcp');
const toolNames = mcpToolList().map(tool => tool.name);
assert.deepEqual(toolNames, ['kurukoo.get_context', 'kurukoo.list_capabilities', 'kurukoo.inspect', 'kurukoo.find', 'kurukoo.execute']);

const codeVerifier = 'mcp-pkce-verifier-012345678901234567890123456789';
const codeChallenge = cryptoHash(codeVerifier);
const auth = beginAuthorization({
  clientId: 'chatgpt-test-client',
  redirectUri: 'https://chatgpt.test/oauth/callback',
  responseType: 'code',
  scope: 'kurukoo.read kurukoo.act',
  state: 'state-123',
  codeChallenge,
  codeChallengeMethod: 'S256',
});

await new Promise(resolve => setTimeout(resolve, 150));
const tx = await getAuthorizationTransaction(auth.transactionId);
assert.equal(tx?.clientId, 'chatgpt-test-client');
const approval = await approveAuthorization(auth.transactionId, '+447700900123');
assert.equal(approval.state, 'state-123');
const tokenSet = await exchangeAuthorizationCode({
  clientId: 'chatgpt-test-client',
  code: approval.code,
  redirectUri: 'https://chatgpt.test/oauth/callback',
  codeVerifier,
});
assert.ok(tokenSet.access_token);
assert.ok(tokenSet.refresh_token);
const token = await verifyAccessToken(String(tokenSet.access_token));
assert.equal(token.phone, '+447700900123');
assert.deepEqual(token.scopes, ['kurukoo.read', 'kurukoo.act']);
const context = await callMcpTool(token, 'kurukoo.get_context', {});
assert.equal((context.connection as any).status, 'connected');
const reminder = await callMcpTool(token, 'kurukoo.execute', {
  capability: 'reminder',
  action: 'create',
  arguments: { title: 'MCP integration test', dueAt: new Date(Date.now() + 3_600_000).toISOString() },
  idempotencyKey: `mcp-test-${process.pid}`,
});
assert.equal((reminder as any).status, 'completed');

console.log('MCP app contract passed:', JSON.stringify({ tools:toolNames.length, phone:token.phone, reminderStatus:(reminder as any).status }));

function cryptoHash(value: string): string {
  const crypto = require('node:crypto') as typeof import('node:crypto');
  return crypto.createHash('sha256').update(value).digest('base64url');
}

const testDb = String(process.env.DB_PATH);
try { fs.rmSync(testDb, { force:true }); } catch { /* best effort */ }
