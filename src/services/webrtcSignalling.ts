type SignalKind = 'offer' | 'answer' | 'ice' | 'hangup';
type Peer = { id: string; joinedAt: number; lastSeenAt: number };
type Signal = { id: string; from: string; to?: string; kind: SignalKind; payload: unknown; createdAt: number };
type Room = { id: string; createdAt: number; expiresAt: number; peers: Map<string, Peer>; signals: Signal[] };

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 30 * 60 * 1000;
const SIGNAL_TTL_MS = 2 * 60 * 1000;

function now() { return Date.now(); }
function roomFor(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.expiresAt <= now()) {
        if (room) rooms.delete(roomId);
        return null;
    }
    room.signals = room.signals.filter(signal => signal.createdAt + SIGNAL_TTL_MS > now());
    return room;
}

export function createWebRTCRoom(roomId: string, phone: string): void {
    if (!roomId || !phone) return;
    let room = roomFor(roomId);
    if (!room) {
        room = { id: roomId, createdAt: now(), expiresAt: now() + ROOM_TTL_MS, peers: new Map(), signals: [] };
        rooms.set(roomId, room);
    }
    room.expiresAt = now() + ROOM_TTL_MS;
    const existing = room.peers.get(phone);
    room.peers.set(phone, existing || { id: phone, joinedAt: now(), lastSeenAt: now() });
    if (existing) existing.lastSeenAt = now();
}

export function touchWebRTCPeer(roomId: string, peerId: string): boolean {
    const room = roomFor(roomId);
    const peer = room?.peers.get(peerId);
    if (!room || !peer) return false;
    peer.lastSeenAt = now();
    room.expiresAt = now() + ROOM_TTL_MS;
    return true;
}

export function leaveWebRTCRoom(roomId: string, peerId: string): boolean {
    const room = roomFor(roomId);
    if (!room) return false;
    const deleted = room.peers.delete(peerId);
    if (room.peers.size === 0) rooms.delete(roomId);
    return deleted;
}

export function getRoomPeers(roomId: string): string[] {
    const room = roomFor(roomId);
    if (!room) return [];
    return Array.from(room.peers.values())
        .filter(peer => peer.lastSeenAt + ROOM_TTL_MS > now())
        .map(peer => peer.id);
}

export function addWebRTCSignal(roomId: string, from: string, kind: SignalKind, payload: unknown, to?: string): Signal {
    const room = roomFor(roomId);
    if (!room) throw new Error('WebRTC room not found or expired');
    if (!room.peers.has(from)) throw new Error('Peer is not a member of this room');
    if (to && !room.peers.has(to)) throw new Error('Target peer is not a member of this room');
    const signal: Signal = {
        id: `${now()}_${Math.random().toString(36).slice(2, 10)}`,
        from,
        to,
        kind,
        payload,
        createdAt: now()
    };
    room.signals.push(signal);
    touchWebRTCPeer(roomId, from);
    return signal;
}

export function getWebRTCSignals(roomId: string, peerId: string, after?: number): Signal[] {
    const room = roomFor(roomId);
    if (!room || !room.peers.has(peerId)) return [];
    const cursor = Number.isFinite(after) ? Number(after) : 0;
    return room.signals.filter(signal =>
        signal.createdAt > cursor && signal.from !== peerId && (!signal.to || signal.to === peerId)
    );
}

export function destroyWebRTCRoom(roomId: string): boolean {
    return rooms.delete(roomId);
}

setInterval(() => {
    const cutoff = now();
    for (const [id, room] of rooms) {
        if (room.expiresAt <= cutoff) rooms.delete(id);
    }
}, 60_000).unref();

export function getWebRTCStatus() {
    const relayConfigured = Boolean(process.env.STUN_SERVERS || process.env.TURN_URL || process.env.TURN_SERVER_URL);
    const enabled = process.env.FF_WEBRTC === 'true' && relayConfigured;
    return {
        signaling: 'repository_ready' as const,
        enabled,
        relayConfigured,
        available: enabled,
        activationRequirement: relayConfigured
            ? 'Independent relay/provider connectivity, authentication, consent, and browser interoperability checks remain required.'
            : 'Configure an approved STUN/TURN or relay service and explicitly enable FF_WEBRTC after security review.',
    };
}
