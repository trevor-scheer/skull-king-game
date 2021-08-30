import { createServer } from "http";
import express from "express";
import { execute, subscribe } from "graphql";
import { ApolloServer } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
import {
  ConnectionContext,
  SubscriptionServer,
} from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";
import WebSocket from "ws";

(async function () {
  const app = express();
  const pubSub = new PubSub();
  const games: Map<number, Game> = new Map();

  const wsServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers(pubSub),
  });
  const server = new ApolloServer({
    schema,
    context() {
      return { games };
    },
    plugins: [
      {
        async requestDidStart({ request }) {
          return {
            async didEncounterErrors({errors}) {
              console.error(errors);
            },
          };
        },
      },
    ],
  });
  await server.start();
  server.applyMiddleware({ app });
  // await server.start();

  wsServer.listen(4000, () =>
    console.log(
      `Server is now running on http://localhost:4000/graphql, ws://localhost:4000/graphql`
    )
  );

  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` created in Step 6 above.
      schema,
      // These were imported from `graphql` in Step 5 above.
      execute,
      subscribe,
      async onConnect(
        headers: any,
        _socket: WebSocket,
        connectionContext: ConnectionContext
      ) {
        // console.log(headers);
        return { games, ...headers };
      },
    },
    {
      // This is the `httpServer` created in Step 9 above.
      server: wsServer,

      // This `server` is the instance returned from `new ApolloServer`.
      path: server.graphqlPath,
    }
  );
})();
