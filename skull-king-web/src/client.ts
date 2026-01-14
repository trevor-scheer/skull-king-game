import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
  })
);

// Split link based on operation type
// - Subscriptions go over WebSocket
// - Queries and Mutations go over HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      PlayedCard: {
        keyFields: ["card", ["id"]],
      },
      Player: {
        fields: {
          hand: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Round: {
        fields: {
          cardsPlayed: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
    possibleTypes: {
      Card: ["SpecialCard", "ColoredCard"],
    },
  }),
});
