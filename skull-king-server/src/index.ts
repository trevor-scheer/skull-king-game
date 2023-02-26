import {  ApolloServer } from "@apollo/server";
import {  startStandaloneServer } from "@apollo/server/standalone";
import {  Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

export interface Context {
  games: Map<string, Game>;
}

(async function () {
  const games: Map<string, Game> = new Map();

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
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

  const { url } = await startStandaloneServer(server, {
    async context() {
      return { games };
    },
    listen: {
      port: Number(process.env.PORT ?? 4000)
    }
  });

  console.log(`
    🚀  Server is ready at ${url}
    📭  Query at https://studio.apollographql.com/dev
  `);
})();
