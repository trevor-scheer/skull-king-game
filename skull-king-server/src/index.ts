import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Game } from "@skull-king/core";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { pubsub } from "./pubsub";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

export interface Context {
  games: Map<string, Game>;
  pubsub: typeof pubsub;
}

const games: Map<string, Game> = new Map();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server with graphql-ws
  const serverCleanup = useServer(
    {
      schema,
      context: async () => ({ games, pubsub }),
    },
    wsServer
  );

  const server = new ApolloServer<Context>({
    schema,
    introspection: true,
    plugins: [
      // Proper shutdown for the HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      {
        async requestDidStart({ request }) {
          return {
            async didEncounterErrors({ errors }) {
              console.error(errors);
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async () => ({ games, pubsub }),
    })
  );

  const PORT = Number(process.env.PORT ?? 4000);
  httpServer.listen(PORT, () => {
    console.log(`
    🚀  Server is ready at http://localhost:${PORT}/
    🔌  WebSocket subscriptions at ws://localhost:${PORT}/graphql
    📭  Query at https://studio.apollographql.com/dev
    `);
  });
}

startServer().catch(console.error);
