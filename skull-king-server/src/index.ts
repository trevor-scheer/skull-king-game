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
import { Accounts } from './accounts';
import { accountRoutes } from './accountRoutes';
import { observeAccountHistory } from './accountHistory';
import type { Context } from './context';
import { boundedOperation, guardGraphqlRequests, requestRateLimit } from './requestLimits';
import { roomEvents } from './roomEvents';
export type { Context } from './context';

export async function createApplication(dataDirectory = process.env.DATA_DIR ?? './data') {
  const rooms = new Rooms(resolve(dataDirectory, 'rooms'));
  const accounts = new Accounts(resolve(dataDirectory, 'accounts.sqlite'));
  const stopHistory = observeAccountHistory(accounts, rooms);
  const server = new ApolloServer<Context>({
    typeDefs, resolvers,
    includeStacktraceInErrorResponses: false,
    allowBatchedHttpRequests: true,
    validationRules: [boundedOperation],

  });
  await server.start();
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY.split(',').map(value => value.trim()));
  app.use(requestRateLimit());
  const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(x => x.trim());
  app.use(cors({ origin(origin, done) { done(null, !origin || origins.includes(origin)); }, credentials: true }));
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/account', accountRoutes(accounts, rooms, origins));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  const events = roomEvents(rooms);
  app.get('/events/:gameId', events.handler);
  app.use('/graphql', guardGraphqlRequests, expressMiddleware(server, { context: async () => ({ games: rooms.games, rooms }) }));
  const staticPath = resolve(__dirname, '../../skull-king-web/dist');
  if (existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: staticPath }));
  }
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'Request could not be completed.' });
  });
  const timer = setInterval(() => { try { rooms.tick(); } catch (error) { console.error('Room maintenance failed', error instanceof Error ? error.message : 'unknown error'); } }, 500);
  timer.unref();
  return { app, rooms, accounts, stop: async () => { clearInterval(timer); events.close(); for (const id of rooms.games.keys()) rooms.save(id, false); await server.stop(); stopHistory(); accounts.close(); } };
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
