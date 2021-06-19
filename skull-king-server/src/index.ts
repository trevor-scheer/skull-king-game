import { ApolloServer } from "apollo-server";
import { Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

const games: Map<number, Game> = new Map();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ req }) {
    // const currentGame;
    return { games };
  },
});

server.listen(4000).then(() => {
  console.log("Skull King server running at http://localhost:4000");
});