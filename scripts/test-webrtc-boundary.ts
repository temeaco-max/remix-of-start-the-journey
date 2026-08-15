import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routeSource = fs.readFileSync(path.join(process.cwd(), 'src', 'routes', 'webrtcRoutes.ts'), 'utf8');
assert.match(routeSource, /function requireWebRTCReadiness/);
assert.match(routeSource, /if \(!requireWebRTCReadiness\(res\)\) return;/);
assert.match(routeSource, /getWebRTCStatus/);

const previous = {
  flag: process.env.FF_WEBRTC,
  stun: process.env.STUN_SERVERS,
  turn: process.env.TURN_URL,
  turnServer: process.env.TURN_SERVER_URL,
};
delete process.env.FF_WEBRTC;
delete process.env.STUN_SERVERS;
delete process.env.TURN_URL;
delete process.env.TURN_SERVER_URL;

const { getWebRTCStatus } = await import('../src/services/webrtcSignalling.ts');
const status = getWebRTCStatus();
assert.equal(status.signaling, 'repository_ready');
assert.equal(status.enabled, false);
assert.equal(status.available, false);
assert.equal(status.relayConfigured, false);
assert.match(status.activationRequirement, /STUN\/TURN|relay/i);

if (previous.flag === undefined) delete process.env.FF_WEBRTC; else process.env.FF_WEBRTC = previous.flag;
if (previous.stun === undefined) delete process.env.STUN_SERVERS; else process.env.STUN_SERVERS = previous.stun;
if (previous.turn === undefined) delete process.env.TURN_URL; else process.env.TURN_URL = previous.turn;
if (previous.turnServer === undefined) delete process.env.TURN_SERVER_URL; else process.env.TURN_SERVER_URL = previous.turnServer;

console.log('WebRTC boundary passed: signalling remains repository-ready but unavailable until the explicit feature flag and relay prerequisites are present.');
