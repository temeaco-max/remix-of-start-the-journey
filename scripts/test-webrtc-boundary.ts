import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routeSource = fs.readFileSync(path.join(process.cwd(), 'src', 'routes', 'webrtcRoutes.ts'), 'utf8');
assert.match(routeSource, /function requireWebRTCReadiness/);
assert.match(routeSource, /router\.get\('\/status'/);
assert.match(routeSource, /router\.get\('\/config'/);
assert.match(routeSource, /getWebRTCClientConfig/);
assert.match(routeSource, /if \(!requireWebRTCReadiness\(res\)\) return;/);
assert.match(routeSource, /getWebRTCStatus/);

const previous = {
  flag: process.env.FF_WEBRTC,
  stun: process.env.STUN_SERVERS,
  turn: process.env.TURN_URL,
  turnServer: process.env.TURN_SERVER_URL,
  username: process.env.TURN_USERNAME,
  credential: process.env.TURN_CREDENTIAL,
};
delete process.env.FF_WEBRTC;
delete process.env.STUN_SERVERS;
delete process.env.TURN_URL;
delete process.env.TURN_SERVER_URL;
delete process.env.TURN_USERNAME;
delete process.env.TURN_CREDENTIAL;

const { getWebRTCStatus, getWebRTCClientConfig } = await import('../src/services/webrtcSignalling.ts');
const status = getWebRTCStatus();
assert.equal(status.signaling, 'repository_ready');
assert.equal(status.enabled, false);
assert.equal(status.available, false);
assert.equal(status.relayConfigured, false);
assert.match(status.activationRequirement, /STUN\/TURN|relay/i);
assert.equal(getWebRTCClientConfig().iceServers.length, 0);

process.env.FF_WEBRTC = 'true';
process.env.STUN_SERVERS = 'stun:stun.example.test:3478';
process.env.TURN_URL = 'turn:turn.example.test:3478';
process.env.TURN_USERNAME = 'test-user';
process.env.TURN_CREDENTIAL = 'test-credential';
const configuredStatus = getWebRTCStatus();
assert.equal(configuredStatus.enabled, true);
assert.equal(configuredStatus.available, true);
assert.equal(configuredStatus.relayConfigured, true);
const config = getWebRTCClientConfig();
assert.equal(config.iceServers.length, 2);
assert.equal(config.transport, 'stun-turn');
assert.equal(config.credentialedTurn, true);
assert.deepEqual(config.iceServers[0], { urls: 'stun:stun.example.test:3478' });
assert.deepEqual(config.iceServers[1], { urls: 'turn:turn.example.test:3478', username: 'test-user', credential: 'test-credential' });

if (previous.flag === undefined) delete process.env.FF_WEBRTC; else process.env.FF_WEBRTC = previous.flag;
if (previous.stun === undefined) delete process.env.STUN_SERVERS; else process.env.STUN_SERVERS = previous.stun;
if (previous.turn === undefined) delete process.env.TURN_URL; else process.env.TURN_URL = previous.turn;
if (previous.turnServer === undefined) delete process.env.TURN_SERVER_URL; else process.env.TURN_SERVER_URL = previous.turnServer;
if (previous.username === undefined) delete process.env.TURN_USERNAME; else process.env.TURN_USERNAME = previous.username;
if (previous.credential === undefined) delete process.env.TURN_CREDENTIAL; else process.env.TURN_CREDENTIAL = previous.credential;

console.log('WebRTC boundary passed: status/config routes, explicit activation and authenticated ICE configuration are wired truthfully.');
