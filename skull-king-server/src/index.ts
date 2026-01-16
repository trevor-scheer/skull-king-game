import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { Game } from "@skull-king/core";
import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
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

  await server.start();

  const app = express();
  const httpServer = http.createServer(app);

  // Serve static files from the web app build
  const staticPath = path.join(__dirname, "../../skull-king-web/dist");
  app.use(express.static(staticPath));

  // Mount Apollo GraphQL middleware at /graphql
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      async context() {
        return { games };
      },
    })
  );

  // SPA fallback - serve index.html for all other routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT ?? 4000);
  httpServer.listen(port, () => {
    console.log(`
    🚀  Server is ready at http://localhost:${port}/
    🎮  Web app at http://localhost:${port}/
    📭  GraphQL at http://localhost:${port}/graphql
  `);
  });
})();
