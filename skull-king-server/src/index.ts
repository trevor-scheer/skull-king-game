import { ApolloServer } from "apollo-server";
import { Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

(async function () {
  const games: Map<number, Game> = new Map();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context() {
      return { games };
    },
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
  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`
      🚀  Server is ready at ${url}
      📭  Query at https://studio.apollographql.com/dev
    `);
  });
})();
