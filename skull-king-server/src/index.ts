import { createServer } from "http";
import express from "express";
import { execute, subscribe } from "graphql";
import { ApolloServer } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

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
    context({ req }) {
      console.log('creating context');
      return { games };
    },
  });
  await server.start();
  server.applyMiddleware({ app });
  // await server.start();

  wsServer.listen(4000, () =>
    console.log(
      `Websocket Server is now running on http://localhost:4000/graphql`
    )
  );

  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` created in Step 6 above.
      schema,
      // These were imported from `graphql` in Step 5 above.
      execute,
      subscribe,
    },
    {
      // This is the `httpServer` created in Step 9 above.
      server: wsServer,

      // This `server` is the instance returned from `new ApolloServer`.
      path: server.graphqlPath,
    }
  );

  // httpServer.listen(4000);
  // console.log("Skull King server running at http://localhost:4000");

  // server.start().then(() => {
  //   server.applyMiddleware({ app });
  //   // app.use(() => {

  //   // })
  //   httpServer.listen(4000);
  //   // app.listen(4000, () => {
  //   //   console.log("Skull King server running at http://localhost:4000");
  //   // });
  //   console.log("Skull King server running at http://localhost:4000");
  // });
})();
