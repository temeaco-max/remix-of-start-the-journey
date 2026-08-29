/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import {
  approveAuthorization,
  beginAuthorization,
  callMcpTool,
  exchangeAuthorizationCode,
  getAuthorizationTransaction,
  getMcpMetadata,
  getProtectedResourceMetadata,
  mcpEnabled,
  mcpToolList,
  refreshAccessToken,
  renderAuthorizationPage,
  requestAuthorizationOtp,
  revokeToken,
  verifyAccessToken,
  verifyAuthorizationOtp,
} from '../services/mcpAppService.js';
import { assertIdentityAllows } from '../services/progressiveIdentityService.js';

const router = Router();

function disabled(res: any): any { return res.status(404).json({ error: 'Kurukoo MCP app integration is not enabled in this deployment.' }); }

router.get('/.well-known/oauth-protected-resource', (_req, res) => {
  if (!mcpEnabled()) return disabled(res);
  try { return res.json(getProtectedResourceMetadata()); } catch (error) { return res.status(500).json({ error: String((error as Error)?.message || error) }); }
});

router.get('/.well-known/oauth-authorization-server', (_req, res) => {
  if (!mcpEnabled()) return disabled(res);
  try { return res.json(getMcpMetadata()); } catch (error) { return res.status(500).json({ error: String((error as Error)?.message || error) }); }
});

router.get('/.well-known/oauth-client-metadata', (_req, res) => {
  if (!mcpEnabled()) return disabled(res);
  const issuer = String(process.env.KURUKOO_MCP_ISSUER || '').replace(/\/$/, '');
  return res.json({
    client_id: String(process.env.KURUKOO_MCP_CLIENT_ID || `${issuer}/mcp-client`),
    client_name: 'Kurukoo',
    redirect_uris: String(process.env.KURUKOO_MCP_REDIRECT_URIS || '').split(',').map(v => v.trim()).filter(Boolean),
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: process.env.KURUKOO_MCP_CLIENT_SECRET ? 'client_secret_post' : 'none',
  });
});

router.get('/oauth/authorize', async (req, res) => {
  if (!mcpEnabled()) return res.status(404).send('Kurukoo MCP integration is not enabled.');
  try {
    const clientId = String(req.query.client_id || '');
    const redirectUri = String(req.query.redirect_uri || '');
    const responseType = String(req.query.response_type || '');
    const scope = String(req.query.scope || 'kurukoo.read');
    const state = req.query.state ? String(req.query.state) : undefined;
    const codeChallenge = req.query.code_challenge ? String(req.query.code_challenge) : undefined;
    const codeChallengeMethod = req.query.code_challenge_method ? String(req.query.code_challenge_method) : undefined;
    const { transactionId, scopes } = await beginAuthorization({ clientId, redirectUri, responseType, scope, state, codeChallenge, codeChallengeMethod });
    return res.status(200).send(renderAuthorizationPage({ transactionId, clientName: clientId, scopes }));
  } catch (error) {
    return res.status(400).send(renderAuthorizationPage({ transactionId:'', clientName:'AI assistant', scopes:[], error:String((error as Error)?.message || error) }));
  }
});

router.post('/oauth/authorize/otp/:transactionId', async (req, res) => {
  try {
    const transactionId = String(req.params.transactionId);
    const tx = await getAuthorizationTransaction(transactionId);
    if (!tx) return res.status(400).send('Authorization request expired or not found.');
    const phone = String(req.body?.phone || '').trim();
    const result = await requestAuthorizationOtp(transactionId, phone);
    return res.status(200).send(renderAuthorizationPage({ transactionId, clientName:tx.clientId, scopes:tx.scope.split(' '), phone, codeSent:result.success, message:result.message, error:result.success ? undefined : result.message }));
  } catch (error) { return res.status(400).send(`Authorization could not continue: ${String((error as Error)?.message || error)}`); }
});

router.post('/oauth/authorize/otp/:transactionId/verify', async (req, res) => {
  try {
    const result = await verifyAuthorizationOtp(String(req.params.transactionId), String(req.body?.phone || ''), String(req.body?.code || ''));
    const location = new URL(result.redirectUri);
    location.searchParams.set('code', result.code);
    if (result.state) location.searchParams.set('state', result.state);
    return res.redirect(302, location.toString());
  } catch (error) {
    const tx = await getAuthorizationTransaction(String(req.params.transactionId));
    return res.status(400).send(renderAuthorizationPage({ transactionId:String(req.params.transactionId), clientName:tx?.clientId || 'AI assistant', scopes:tx?.scope?.split(' ') || [], phone:String(req.body?.phone || ''), codeSent:true, error:String((error as Error)?.message || error) }));
  }
});

router.post('/oauth/authorize/consent/:transactionId', async (req, res) => {
  try {
    const transactionId = String(req.params.transactionId);
    const tx = await getAuthorizationTransaction(transactionId);
    if (!tx) return res.status(400).send('Authorization request expired or not found.');
    const cookie = String(req.headers.cookie || '');
    const authCookie = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('kurukoo_auth='));
    if (!authCookie) return res.status(401).send(renderAuthorizationPage({ transactionId, clientName:tx.clientId, scopes:tx.scope.split(' '), error:'No active Kurukoo session was found. Use the phone verification form first.' }));
    const jwtToken = decodeURIComponent(authCookie.slice('kurukoo_auth='.length));
    const { phone } = await verifyAccessTokenForKurukooCookie(jwtToken);
    const result = await approveAuthorization(transactionId, phone);
    const location = new URL(result.redirectUri);
    location.searchParams.set('code', result.code);
    if (result.state) location.searchParams.set('state', result.state);
    return res.redirect(302, location.toString());
  } catch (error) { return res.status(400).send(`Authorization could not continue: ${String((error as Error)?.message || error)}`); }
});

async function verifyAccessTokenForKurukooCookie(token:string):Promise<{phone:string}> {
  const jwt = await import('jsonwebtoken');
  const secret = String(process.env.JWT_SECRET || '');
  if (!secret) throw new Error('Kurukoo authentication secret is not configured');
  const decoded = jwt.default.verify(token, secret, { algorithms:['HS256'] }) as any;
  if (!decoded?.phone || decoded?.role === 'guest') throw new Error('Invalid Kurukoo session');
  return { phone:String(decoded.phone) };
}

router.post('/oauth/token', async (req, res) => {
  if (!mcpEnabled()) return disabled(res);
  try {
    const grantType = String(req.body?.grant_type || '');
    const clientId = String(req.body?.client_id || '');
    const clientSecret = req.body?.client_secret ? String(req.body.client_secret) : undefined;
    const result = grantType === 'authorization_code'
      ? await exchangeAuthorizationCode({ clientId, clientSecret, code:String(req.body?.code || ''), redirectUri:String(req.body?.redirect_uri || ''), codeVerifier:req.body?.code_verifier ? String(req.body.code_verifier) : undefined })
      : grantType === 'refresh_token'
        ? await refreshAccessToken({ clientId, clientSecret, refreshToken:String(req.body?.refresh_token || '') })
        : (() => { throw new Error('Unsupported grant_type'); })();
    return res.json(result);
  } catch (error) { return res.status(400).json({ error:'invalid_grant', error_description:String((error as Error)?.message || error) }); }
});

router.post('/oauth/revoke', async (req, res) => {
  if (!mcpEnabled()) return disabled(res);
  try { await revokeToken(String(req.body?.token || '')); return res.status(200).json({ revoked:true }); } catch { return res.status(200).json({ revoked:true }); }
});

router.post('/mcp', async (req, res) => {
  if (!mcpEnabled()) return disabled(res);
  const protocolVersion = String(req.headers['mcp-protocol-version'] || req.body?.params?.protocolVersion || '2025-06-18');
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${String(process.env.KURUKOO_MCP_ISSUER || '').replace(/\/$/, '')}/.well-known/oauth-protected-resource"`);
    return res.status(401).json({ error:'unauthorized', message:'Bearer OAuth access token required' });
  }
  let auth:{phone:string;clientId:string;scopes:any[]};
  try { auth = await verifyAccessToken(authHeader.slice(7).trim()); } catch (error) { return res.status(401).json({ error:'invalid_token', error_description:String((error as Error)?.message || error) }); }

  const rpc = req.body || {};
  const id = rpc.id;
  const method = String(rpc.method || '');
  try {
    if (method === 'initialize') { res.setHeader('Mcp-Protocol-Version', protocolVersion); return res.json({ jsonrpc:'2.0', id, result:{ protocolVersion:'2025-06-18', capabilities:{tools:{}}, serverInfo:{name:'kurukoo',version:'5.67.0'} } }); }
    if (method === 'notifications/initialized' || method.startsWith('notifications/')) return res.status(202).end();
    if (method === 'ping') return res.json({ jsonrpc:'2.0', id, result:{} });
    if (method === 'tools/list') return res.json({ jsonrpc:'2.0', id, result:{ tools:mcpToolList() } });
    if (method === 'tools/call') {
      const name = String(rpc.params?.name || '');
      const args = rpc.params?.arguments || {};
      if (name === 'kurukoo.execute') {
        const capability = String(args.capability || '').trim().toLowerCase();
        const required = capability === 'payment' ? 'payment' : capability === 'execution' ? 'provider_action' : capability === 'agent' ? 'agent_goal' : capability === 'memory' ? 'sensitive_memory' : capability === 'presence' ? 'pulse_broadcast' : capability === 'economic_request' ? 'economic_request' : 'chat';
        const gate = await assertIdentityAllows(auth.phone, required as any);
        if (!gate.allowed) return res.json({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text:gate.reason || 'This action is not permitted at the current identity tier.' }], structuredContent:{ allowed:false, identity:gate.snapshot.cardData }, isError:true } });
      }
      const result = await callMcpTool(auth, name, args);
      return res.json({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text:JSON.stringify(result) }], structuredContent:result, isError:false } });
    }
    return res.status(400).json({ jsonrpc:'2.0', id, error:{ code:-32601, message:`Unsupported MCP method: ${method}` } });
  } catch (error) { return res.json({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text:String((error as Error)?.message || error) }], isError:true } }); }
});

router.get('/mcp', (_req, res) => res.status(405).json({ error:'MCP uses POST Streamable HTTP JSON-RPC requests in this deployment.' }));

export default router;
