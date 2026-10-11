import type { RequestHandler } from 'express';
import type { Rooms } from './rooms';

export function roomEvents(rooms: Rooms) {
  const addresses = new Map<string, number>();
  const roomCounts = new Map<string, number>();
  const connections = new Set<() => void>();
  const handler: RequestHandler = (req, res) => {
    const id = String(req.params.gameId);
    if (!rooms.games.has(id)) { res.sendStatus(404); return; }
    const address = req.ip ?? req.socket.remoteAddress ?? 'local';
    if (connections.size >= 1000 || (addresses.get(address) ?? 0) >= 32 || (roomCounts.get(id) ?? 0) >= 64) {
      res.set('Retry-After', '10').status(429).end(); return;
    }
    addresses.set(address, (addresses.get(address) ?? 0) + 1);
    roomCounts.set(id, (roomCounts.get(id) ?? 0) + 1);
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      clearInterval(heartbeat); rooms.updates.off(id, changed); connections.delete(close);
      for (const [map, key] of [[addresses, address], [roomCounts, id]] as const) {
        const count = (map.get(key) ?? 1) - 1;
        if (count) map.set(key, count); else map.delete(key);
      }
      res.end();
    };
    // A slow reader must reconnect instead of accumulating an unbounded buffer.
    const write = (message: string) => { if (!closed && !res.write(message)) close(); };
    const changed = () => rooms.games.has(id) ? write('data: changed\n\n') : close();
    const heartbeat = setInterval(() => write(': heartbeat\n\n'), 20_000);
    connections.add(close); rooms.updates.on(id, changed); res.on('close', close); changed();
  };
  return { handler, close: () => { for (const close of connections) close(); } };
}
