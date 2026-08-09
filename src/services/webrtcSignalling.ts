const rooms = new Map<string, string[]>();

export function createWebRTCRoom(roomId: string, phone: string): void {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
    }
    rooms.get(roomId)?.push(phone);
}

export function getRoomPeers(roomId: string): string[] {
    return rooms.get(roomId) || [];
}
