import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import resolvers from './resolvers';
import typeDefs from './typeDefs';
import { Rooms } from './rooms';
import type { Context } from './context';
export type { Context } from './context';

export async function createApplication(dataDirectory = process.env.DATA_DIR ?? './data') {
  const rooms = new Rooms(resolve(dataDirectory, 'rooms'));
  const server = new ApolloServer<Context>({
    typeDefs, resolvers,
    includeStacktraceInErrorResponses: false,
    plugins: [{ async requestDidStart() {
      const before = new Set(rooms.games.keys());
      return {
      async willSendResponse({ operation, request }) {
        if (operation?.operation !== 'mutation') return;
        // A multi-field mutation can partly succeed; checkpoint all touched rooms even on errors.
        const id = request.variables?.gameId;
        if (typeof id === 'string') rooms.save(id);
        else for (const gameId of rooms.games.keys()) if (!before.has(gameId)) rooms.save(gameId);
      },
    }; } }],
  });
  await server.start();
  const app = express();
  app.disable('x-powered-by');
  const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(x => x.trim());
  app.use(cors({ origin(origin, done) { done(null, !origin || origins.includes(origin)); }, credentials: true }));
  app.use(express.json({ limit: '64kb' }));
  const requests = new Map<string, { count: number; reset: number }>();
  app.use((req, res, next) => {
    const key = req.socket.remoteAddress ?? 'local';
    const now = Date.now();
    let bucket = requests.get(key);
    if (!bucket || bucket.reset < now) { bucket = { count: 0, reset: now + 60_000 }; requests.set(key, bucket); }
    if (++bucket.count > 1200) { res.status(429).json({ error: 'Please wait a moment before trying again.' }); return; }
    if (requests.size > 10000) for (const [ip, entry] of requests) if (entry.reset < now) requests.delete(ip);
    next();
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/events/:gameId', (req, res) => {
    const id = String(req.params.gameId);
    if (!rooms.games.has(id)) { res.sendStatus(404); return; }
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const changed = () => res.write('data: changed\n\n');
    changed();
    rooms.updates.on(id, changed);
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20_000);
    req.on('close', () => { clearInterval(heartbeat); rooms.updates.off(id, changed); });
  });
  app.use('/graphql', expressMiddleware(server, { context: async () => ({ games: rooms.games, rooms }) }));
  const staticPath = resolve(__dirname, '../../skull-king-web/dist');
  if (existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(staticPath, 'index.html')));
  }
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'Request could not be completed.' });
  });
  const timer = setInterval(() => { try { rooms.tick(); } catch (error) { console.error('Room maintenance failed', error instanceof Error ? error.message : 'unknown error'); } }, 500);
  timer.unref();
  return { app, rooms, stop: async () => { clearInterval(timer); for (const id of rooms.games.keys()) rooms.save(id); await server.stop(); } };
}

if (require.main === module) {
  void createApplication().then(({ app, stop }) => {
    const http = createServer(app);
    const port = Number(process.env.PORT ?? 4000);
    http.listen(port, () => console.log(`Skull King ready on port ${port}`));
    const shutdown = () => { http.close(); void stop().then(() => process.exit(0)); setTimeout(() => process.exit(1), 10000).unref(); };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  }).catch(error => { console.error(error); process.exitCode = 1; });
}
