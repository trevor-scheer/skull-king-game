import { ApolloServer } from "apollo-server";
import { Game } from "@skull-king/core";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";
import ws from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { buildSchema } from "graphql";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const games: Map<number, Game> = new Map();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ req }) {
    // const currentGame;
    return { games, pubsub };
  },
});

const schema = buildSchema(`#graphql
  type Query {
    hello: String
  }
  type Subscription {
    hello: String
    state(id: Int!): GameState
  }

  type GameState {
    phase: String!
    players: [Player!]!
    currentRound: CurrentRound!
    # deck: Deck!
    # scorecard: Scorecard
  }

  type Player {
    name: String!
    hand: [Card!]!
  }

  union Card = SpecialCard | ColoredCard

  type SpecialCard {
    type: String!
    selection: String
  }

  type ColoredCard {
    color: String!
    number: Int!
  }

  type CurrentRound {
    roundNumber: Int!
    # TODO
  }
`);

// The roots provide resolvers for each GraphQL operation
const roots = {
  query: {
    hello: () => "Hello World!",
  },
  subscription: {
    hello: async function* () {
      yield { hello: "Hello World!" };
    },
    state: (args: any, context: any) => {
      console.log(args);
      return pubsub.asyncIterator(`GAME_UPDATED_${args.id}`);
      // console.log({ args, context });
      // console.log(context.games);
      // const game = context.games.get(args.id);
      // const { phase, players, currentRound } = game.__debugDump();
      // console.log({ phase, players, currentRound });
      // yield { state: { phase, players, currentRound } };
    },
  },
};

const wsServer = new ws.Server({
  port: 4001,
  path: "/",
});

useServer(
  // from the previous step
  {
    schema,
    roots,
    context() {
      return { games };
    },
  },
  wsServer
);


server.listen(4000).then(() => {
  console.log("Skull King server running at http://localhost:4000");
});
